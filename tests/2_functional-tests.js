'use strict';

const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  this.timeout(5000);
  test('POST /api/threads/:board', function(done) {
    chai.request(server)
      .post('/api/threads/test')
      .send({
        text: 'Hilo de prueba',
        delete_password: 'clave123'
      })
      .end(function(err, res) {
        if (err) return done(err);
        assert.equal(res.status, 200);
        assert.isArray(res.redirects);
        assert.include(res.redirects[0], '/b/test');
        done();
      });
  });

  // Los demás tests los podés ir agregando después
});

