const express = require('express');
const ejs = require('ejs');
const paypal = require('paypal-rest-sdk');
const request = require('request');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));



app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header('Access-Control-Allow-Credentials', true);
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});



paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'AfYydU6ft4RaMSMdOGe5qLNAeZjJhN3z4WHAhxuHf-IyI_osgGNvdQ9ZGXC-ZW7jysC-fTiJf1UFz0OD',
  'client_secret': 'ECo6t2oyN_RGzdHA8YUKejh82rVZ1ro_ZMKXCaO7MyEvR6GOO-0pnqS4_4G2rnz17AbWARJ0yTEUjUPJ'
});

var CLIENT ='AfYydU6ft4RaMSMdOGe5qLNAeZjJhN3z4WHAhxuHf-IyI_osgGNvdQ9ZGXC-ZW7jysC-fTiJf1UFz0OD';
var SECRET ='ECo6t2oyN_RGzdHA8YUKejh82rVZ1ro_ZMKXCaO7MyEvR6GOO-0pnqS4_4G2rnz17AbWARJ0yTEUjUPJ';
var PAYPAL_API = 'https://api.sandbox.paypal.com';

const AUTH = {
  username: CLIENT,
  password: SECRET,
}

app.set('view engine', 'ejs');

app.get('/', (req, res) => res.render('index'));

app.post('/pay', (req, res) => {
  const create_payment_json = {
    "intent": "sale",
    "payer": {
        "payment_method": "paypal"
    },
    "redirect_urls": {
        "return_url": "http://localhost:3000/success",
        "cancel_url": "http://localhost:3000/cancel"
    },
    "transactions": [{
        "item_list": {
            "items": [{
                "name": "Red Sox Hat",
                "sku": "001",
                "price": "25.00",
                "currency": "USD",
                "quantity": 1
            }]
        },
        "amount": {
            "currency": "USD",
            "total": "25.00"
        },
        "description": "Hat for the best team ever"
    }]
  };

  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
        throw error;
    } else {
        for(let i = 0;i < payment.links.length;i++){
          if(payment.links[i].rel === 'approval_url'){
            res.redirect(payment.links[i].href);
          }
        }
    }
  });
});


const { default: axios } = require("axios");

// PROD-06E440233T089811V
app.post('/create-product', async (req, res) => {
  const product_json = {
    "name": "Video Streaming Service",
    "description": "Video streaming service",
    "type": "SERVICE",
    "category": "SOFTWARE",
    "image_url": "https://example.com/streaming.jpg",
    "home_url": "https://example.com/home"
  };

  const options = {
    url: "https://api-m.sandbox.paypal.com/v1/catalogs/products",
    method: "POST",
    auth: AUTH,
    data: product_json,
  };
  const { status, data } = await axios(options);
  console.log(status, data)
  //return data.access_token;
  res.send(data);

});

//id: 'P-4CA44308RT9394204MGS7BWY',
//product_id: 'PROD-06E440233T089811V'

app.post('/create-plan', async (req, res) => {
  const plan_json = {
    "product_id": "PROD-06E440233T089811V",
    "name": "Basic Plan",
    "description": "Basic plan",
    "billing_cycles": [
      {
        "frequency": {
          "interval_unit": "MONTH",
          "interval_count": 1
        },
        "tenure_type": "TRIAL",
        "sequence": 1,
        "total_cycles": 1
      },
      {
        "frequency": {
          "interval_unit": "MONTH",
          "interval_count": 1
        },
        "tenure_type": "REGULAR",
        "sequence": 2,
        "total_cycles": 12,
        "pricing_scheme": {
          "fixed_price": {
            "value": "10",
            "currency_code": "USD"
          }
        }
      }
    ],
    "payment_preferences": {
      "auto_bill_outstanding": true,
      "setup_fee": {
        "value": "10",
        "currency_code": "USD"
      },
      "setup_fee_failure_action": "CONTINUE",
      "payment_failure_threshold": 3
    },
    "taxes": {
      "percentage": "10",
      "inclusive": false
    }
  };

  const options = {
    url: "https://api-m.sandbox.paypal.com/v1/billing/plans",
    method: "POST",
    auth: AUTH,
    data: plan_json,
  };
  const { status, data } = await axios(options);
  console.log(status, data)
  //return data.access_token;
  res.send(data);
});




app.get('/success', (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
        "amount": {
            "currency": "USD",
            "total": "25.00"
        }
    }]
  };

  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    if (error) {
        console.log(error.response);
        throw error;
    } else {
        console.log(JSON.stringify(payment));
        res.send('Success');
    }
});
});

app.get('/cancel', (req, res) => res.send('Cancelled'));

app.listen(3000, () => console.log('Server Started'));