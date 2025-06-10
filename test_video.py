import unittest
from app import create_app, db
from app.models import Video

class VideoTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app('testing')
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_video_creation(self):
        video = Video(title='Test Video', 
                     description='Test Description',
                     filename='test.mp4')
        db.session.add(video)
        db.session.commit()
        self.assertTrue(Video.query.filter_by(title='Test Video').first() is not None)

if __name__ == '__main__':
    unittest.main() 