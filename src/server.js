'use strict';

const express      = require('express');
const bodyParser   = require('body-parser');
const resqueDriver = require('./lib/resque_driver');
const twilio       = require('twilio');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

//  ==================
//  = Start Function =
//  ==================
async function start() {

  const app = express();
  const resque = await resqueDriver.getQueue();

  resque.queue.enqueue('startup.sync.worker.data','startup_sync_worker_data');

  // App
  app.disable('etag');
  app.disable('x-powered-by');

  // setup bodyParser
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  function validateTwilioSignature (req, res, next) {
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioSignature = req.headers['x-twilio-signature'];
    const url = `${req.headers['x-forwarded-proto']}://${req.headers['host']}/ingress`;
    const params = req.body;
    if (twilio.validateRequest(authToken, twilioSignature, url, params)) {
      next()
    } else {
      return res.status(400).json({ 'status': 'You\'re not from Twilio, are you?' });
    }
  }

  //  ============
  //  = Route: / =
  //  ============
  app.get('/', (req, res) => {
    res.status(404);
    res.send('Not found');
  });

  //  ===================
  //  = Route: /ingress =
  //  ===================
  app.post('/ingress', [validateTwilioSignature], async(req, res) => {
    return resque.queue.enqueue('ingress', 'ingress_job', JSON.stringify(req.body))
      .then(() => {
        return res.status(200).json({
          payload: {
            message: "ok"
          }
        });
      })
      .catch((err) => {
        return res.status(500).json({
          error: 500,
          payload: {
            message: err.message
          }
        });
      });
  });


  //  ==================
  //  = Run the server =
  //  ==================
  app.listen(PORT, HOST);
  console.log(`Running on http://${HOST}:${PORT}`);
}

//  =====================
//  = Shutdown Function =
//  =====================
async function shutdown() {
  console.log('    ### RECEIVED SHUTDOWN SIGNAL ###.   ');
  await resqueDriver.shutdown();
  console.log('Server is now ready to exit, bye bye...');
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start();
