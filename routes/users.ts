var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(_req: any, res: { send: (arg0: string) => void; }, _next: any) {
  res.send('respond with a resource');
});

module.exports = router;
