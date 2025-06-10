import React from 'react';

/**
 * 浮动装饰元素组件
 * 页面背景的动画装饰元素
 */
const FloatingElements = () => {
  const elements = [
    {
      className: 'floating f1',
      path: 'M12,2L4.5,20.5L19.5,20.5Z'
    },
    {
      className: 'floating f2',
      element: 'circle',
      props: { cx: '12', cy: '12', r: '10' }
    },
    {
      className: 'floating f3',
      element: 'rect',
      props: { x: '2', y: '2', width: '20', height: '20', rx: '4' }
    },
    {
      className: 'floating f4',
      path: 'M12,2L2,22L22,22Z'
    }
  ];

  return (
    <>
      {elements.map((element, index) => (
        <div key={index} className={element.className}>
          <svg viewBox="0 0 24 24" fill="var(--primary)">
            {element.path ? (
              <path d={element.path} />
            ) : (
              React.createElement(element.element, element.props)
            )}
          </svg>
        </div>
      ))}
    </>
  );
};

export default FloatingElements; 