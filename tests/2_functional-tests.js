'use strict';

const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function () {
  this.timeout(5000);

  let threadIdMain;
  let threadIdReply;
  let replyId;

  // Crear hilo principal
  test('Crear hilo en /api/threads/:board', function (done) {
    chai.request(server)
      .post('/api/threads/test')
      .send({ text: 'Primer hilo', delete_password: 'clave123' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        done();
      });
  });

  // Obtener hilo principal
  test('Obtener hilos desde /api/threads/:board', function (done) {
    chai.request(server)
      .get('/api/threads/test')
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        threadIdMain = res.body[0]._id;
        done();
      });
  });

  // Reportar hilo
  test('Reportar hilo en /api/threads/:board', function (done) {
    chai.request(server)
      .put('/api/threads/test')
      .send({ thread_id: threadIdMain })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'reported'); 
        done();
      });
  });

  // Eliminar hilo con contraseña incorrecta
  test('Eliminar hilo con contraseña incorrecta', function (done) {
    chai.request(server)
      .delete('/api/threads/test')
      .send({ thread_id: threadIdMain, delete_password: 'claveIncorrecta' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  // Eliminar hilo con contraseña correcta
  test('Eliminar hilo con contraseña correcta', function (done) {
    chai.request(server)
      .delete('/api/threads/test')
      .send({ thread_id: threadIdMain, delete_password: 'clave123' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success');
        done();
      });
  });

  test('Crear respuesta en /api/replies/:board', function (done) {
  chai.request(server)
    .post('/api/threads/test')
    .send({ text: 'Hilo para responder', delete_password: 'clave123' })
    .end((err, res) => {
      // Asegurate de que el servidor devuelva el thread en el body
      threadIdReply = res.body._id || res.body.id || res.body.thread_id;


      chai.request(server)
        .post('/api/replies/test')
        .send({ thread_id: threadIdReply, text: 'Respuesta nueva', delete_password: 'clave456' })
        .end((err, res) => {
          assert.equal(res.status, 200);
          done();
        });
    });
});

  // Obtener respuestas
  test('Obtener respuestas desde /api/replies/:board', function (done) {
    chai.request(server)
      .get('/api/replies/test')
      .query({ thread_id: threadIdReply })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isObject(res.body);
        assert.isArray(res.body.replies);
        replyId = res.body.replies[0]._id;
        done();
      });
  });

  // Reportar respuesta
  test('Reportar respuesta en /api/replies/:board', function (done) {
    chai.request(server)
      .put('/api/replies/test')
      .send({ thread_id: threadIdReply, reply_id: replyId })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'reported');
        done();
      });
  });

  // Eliminar respuesta con contraseña incorrecta
  test('Eliminar respuesta con contraseña incorrecta', function (done) {
    chai.request(server)
      .delete('/api/replies/test')
      .send({ thread_id: threadIdReply, reply_id: replyId, delete_password: 'claveIncorrecta' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  // Eliminar respuesta con contraseña correcta
  test('Eliminar respuesta con contraseña correcta', function (done) {
    chai.request(server)
      .delete('/api/replies/test')
      .send({ thread_id: threadIdReply, reply_id: replyId, delete_password: 'clave456' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success');
        done();
      });
  });
});
