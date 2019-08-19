from aleph.tests.util import TestCase


class DashboardApiTestCase(TestCase):

    def setUp(self):
        super(DashboardApiTestCase, self).setUp()

    def test_index(self):
        res = self.client.get('/api/2/dashboard')
        assert res.status_code == 403, res
        _, headers = self.login()
        res = self.client.get('/api/2/dashboard',
                              headers=headers)
        assert res.status_code == 200, res
        assert res.json.get('total') == 0, res.json
