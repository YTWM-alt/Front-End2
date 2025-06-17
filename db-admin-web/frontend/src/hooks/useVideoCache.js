import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * 视频缓存管理Hook
 * 功能：
 * 1. 缓存播放过的视频片段
 * 2. 记录播放进度
 * 3. 智能预加载
 * 4. 缓存清理策略
 */
const useVideoCache = () => {
  const [cache, setCache] = useState(new Map());
  const [playbackHistory, setPlaybackHistory] = useState(new Map());
  const [isPreloading, setIsPreloading] = useState(false);
  const preloadQueue = useRef(new Set());
  
  // 缓存配置
  const CACHE_CONFIG = {
    maxSize: 500 * 1024 * 1024, // 最大缓存大小500MB
    maxAge: 24 * 60 * 60 * 1000, // 缓存过期时间24小时
    chunkSize: 2 * 1024 * 1024, // 预加载块大小2MB
    preloadThreshold: 0.8, // 播放进度达到80%时预加载下一块
    maxCacheEntries: 50 // 最大缓存条目数
  };

  // 计算当前缓存总大小
  const getCurrentCacheSize = useCallback(() => {
    let totalSize = 0;
    cache.forEach(item => {
      if (item.data && item.data.byteLength) {
        totalSize += item.data.byteLength;
      }
    });
    return totalSize;
  }, [cache]);

  // 清理过期的缓存条目
  const cleanExpiredCache = useCallback(() => {
    const now = Date.now();
    const newCache = new Map();
    
    cache.forEach((item, key) => {
      if (now - item.timestamp < CACHE_CONFIG.maxAge) {
        newCache.set(key, item);
      }
    });
    
    setCache(newCache);
    console.log(`缓存清理完成，清理了 ${cache.size - newCache.size} 个过期条目`);
  }, [cache]);

  // LRU清理策略 - 当缓存超出限制时清理最久未使用的条目
  const cleanLRUCache = useCallback(() => {
    if (cache.size <= CACHE_CONFIG.maxCacheEntries) return;
    
    const sortedEntries = Array.from(cache.entries()).sort((a, b) => 
      a[1].lastAccessed - b[1].lastAccessed
    );
    
    const newCache = new Map();
    const keepCount = Math.floor(CACHE_CONFIG.maxCacheEntries * 0.8); // 保留80%的条目
    
    sortedEntries.slice(-keepCount).forEach(([key, value]) => {
      newCache.set(key, value);
    });
    
    setCache(newCache);
    console.log(`LRU清理完成，保留了 ${keepCount} 个最近使用的条目`);
  }, [cache]);

  // 清理缓存以释放空间
  const cleanCacheBySize = useCallback(() => {
    const currentSize = getCurrentCacheSize();
    if (currentSize <= CACHE_CONFIG.maxSize) return;
    
    const sortedEntries = Array.from(cache.entries()).sort((a, b) => 
      a[1].lastAccessed - b[1].lastAccessed
    );
    
    const newCache = new Map();
    let newSize = 0;
    const targetSize = CACHE_CONFIG.maxSize * 0.8; // 清理到80%容量
    
    // 从最新访问的开始保留
    for (let i = sortedEntries.length - 1; i >= 0; i--) {
      const [key, item] = sortedEntries[i];
      const itemSize = item.data ? item.data.byteLength : 0;
      
      if (newSize + itemSize <= targetSize) {
        newCache.set(key, item);
        newSize += itemSize;
      }
    }
    
    setCache(newCache);
    console.log(`大小清理完成，从 ${(currentSize / 1024 / 1024).toFixed(2)}MB 减少到 ${(newSize / 1024 / 1024).toFixed(2)}MB`);
  }, [cache, getCurrentCacheSize]);

  // 从缓存获取视频数据
  const getCachedVideoData = useCallback((videoId, range = null) => {
    const cacheKey = range ? `${videoId}-${range.start}-${range.end}` : `${videoId}-full`;
    const cachedItem = cache.get(cacheKey);
    
    if (cachedItem) {
      // 更新最后访问时间
      cachedItem.lastAccessed = Date.now();
      setCache(prev => new Map(prev.set(cacheKey, cachedItem)));
      
      console.log(`缓存命中: ${cacheKey}`);
      return cachedItem.data;
    }
    
    return null;
  }, [cache]);

  // 将视频数据存入缓存
  const setCachedVideoData = useCallback((videoId, data, range = null) => {
    const cacheKey = range ? `${videoId}-${range.start}-${range.end}` : `${videoId}-full`;
    const now = Date.now();
    
    const cacheItem = {
      data,
      timestamp: now,
      lastAccessed: now,
      videoId,
      range,
      size: data.byteLength || 0
    };
    
    setCache(prev => new Map(prev.set(cacheKey, cacheItem)));
    console.log(`缓存存储: ${cacheKey}, 大小: ${(cacheItem.size / 1024 / 1024).toFixed(2)}MB`);
    
    // 检查是否需要清理缓存
    setTimeout(() => {
      cleanCacheBySize();
      cleanLRUCache();
    }, 100);
  }, [cleanCacheBySize, cleanLRUCache]);

  // 预加载视频片段
  const preloadVideoSegment = useCallback(async (videoId, streamUrl, startByte, endByte) => {
    if (preloadQueue.current.has(`${videoId}-${startByte}-${endByte}`)) {
      return; // 已在预加载队列中
    }
    
    const range = { start: startByte, end: endByte };
    const cached = getCachedVideoData(videoId, range);
    if (cached) {
      return; // 已缓存
    }
    
    preloadQueue.current.add(`${videoId}-${startByte}-${endByte}`);
    
    try {
      const response = await fetch(streamUrl, {
        headers: {
          'Range': `bytes=${startByte}-${endByte}`
        }
      });
      
      if (response.status === 206) { // Partial Content
        const arrayBuffer = await response.arrayBuffer();
        setCachedVideoData(videoId, arrayBuffer, range);
        console.log(`预加载完成: ${videoId} [${startByte}-${endByte}]`);
      }
    } catch (error) {
      console.error(`预加载失败: ${videoId} [${startByte}-${endByte}]`, error);
    } finally {
      preloadQueue.current.delete(`${videoId}-${startByte}-${endByte}`);
    }
  }, [getCachedVideoData, setCachedVideoData]);

  // 智能预加载策略
  const smartPreload = useCallback(async (videoId, streamUrl, currentProgress, totalDuration, fileSize) => {
    if (isPreloading) return;
    
    setIsPreloading(true);
    
    try {
      const progressRatio = currentProgress / totalDuration;
      
      if (progressRatio > CACHE_CONFIG.preloadThreshold) {
        // 计算需要预加载的范围
        const bytesPerSecond = fileSize / totalDuration;
        const currentByte = Math.floor(progressRatio * fileSize);
        const nextChunkStart = Math.min(currentByte, fileSize - 1);
        const nextChunkEnd = Math.min(nextChunkStart + CACHE_CONFIG.chunkSize, fileSize - 1);
        
        if (nextChunkEnd > nextChunkStart) {
          await preloadVideoSegment(videoId, streamUrl, nextChunkStart, nextChunkEnd);
        }
      }
    } catch (error) {
      console.error('智能预加载失败:', error);
    } finally {
      setIsPreloading(false);
    }
  }, [isPreloading, preloadVideoSegment]);

  // 记录播放进度
  const recordPlaybackProgress = useCallback((videoId, currentTime, duration) => {
    setPlaybackHistory(prev => {
      const newHistory = new Map(prev);
      newHistory.set(videoId, {
        currentTime,
        duration,
        timestamp: Date.now(),
        progressRatio: duration > 0 ? currentTime / duration : 0
      });
      return newHistory;
    });
  }, []);

  // 获取播放进度
  const getPlaybackProgress = useCallback((videoId) => {
    return playbackHistory.get(videoId) || { currentTime: 0, duration: 0, progressRatio: 0 };
  }, [playbackHistory]);

  // 清理所有缓存
  const clearAllCache = useCallback(() => {
    setCache(new Map());
    setPlaybackHistory(new Map());
    preloadQueue.current.clear();
    console.log('所有缓存已清理');
  }, []);

  // 获取缓存统计信息
  const getCacheStats = useCallback(() => {
    const totalSize = getCurrentCacheSize();
    return {
      totalEntries: cache.size,
      totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      maxSizeMB: (CACHE_CONFIG.maxSize / 1024 / 1024).toFixed(2),
      usagePercent: ((totalSize / CACHE_CONFIG.maxSize) * 100).toFixed(1),
      playbackHistoryCount: playbackHistory.size,
      preloadQueueSize: preloadQueue.current.size
    };
  }, [cache, getCurrentCacheSize, playbackHistory]);

  // 定期清理过期缓存
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      cleanExpiredCache();
    }, 10 * 60 * 1000); // 每10分钟清理一次

    return () => clearInterval(cleanupInterval);
  }, [cleanExpiredCache]);

  // 页面卸载时清理预加载队列
  useEffect(() => {
    const handleBeforeUnload = () => {
      preloadQueue.current.clear();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return {
    // 缓存操作
    getCachedVideoData,
    setCachedVideoData,
    clearAllCache,
    
    // 预加载
    preloadVideoSegment,
    smartPreload,
    isPreloading,
    
    // 播放进度
    recordPlaybackProgress,
    getPlaybackProgress,
    
    // 统计和管理
    getCacheStats,
    cleanExpiredCache,
    cleanCacheBySize,
    
    // 状态
    cacheSize: cache.size,
    totalCacheSize: getCurrentCacheSize()
  };
};

export default useVideoCache; 