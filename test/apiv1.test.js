var assert = require("assert");//gives us basic assersions
var request = require("supertest");//gives us assertions on the http calls
var should = require("should");

var url  = 'http://localhost:3002';        

describe('apiv1', function(){
  this.timeout(60000);  
  it.skip('should not barf',function(done){

      request(url)
       .get('/apiv1/integrationBus?depth=7')
       .end(function(err,res){
           if(err) {
               throw err;
           }
           done();
       });
  });


  it.skip('should return an object 7 deep', function(done){

      request(url)
       .get('/apiv1/integrationBus?depth=7')
       .expect(200)
       .end(function(err,res){
           if(err) {
               throw err;
           }
           done();
      });
  });


  it('Should be able to get the integration nodes ', function(done){
      request(url)
       .get('/apiv1/integrationBus?depth=7')
       .expect(200)
       .end(function(err,res){
           if(err) {
               throw err;
           }
           console.log(res.text);
           //console.dir(res.body.integrationNodes.integrationNode[0]);
           res.body.should.have.property("integrationNodes");
           res.body.integrationNodes.should.have.property("type","integrationNodes");
           res.body.integrationNodes.should.have.property("integrationNode");
           res.body.integrationNodes.integrationNode.should.be.array;
           res.body.integrationNodes.integrationNode[0].should.have.property("type","integrationNode");
           done();
      });
  });


  it('Should be able to get the integration servers ', function(done){

      request(url)
       .get('/apiv1/integrationBus?depth=7')
       .expect(200)
       .end(function(err,res){
           if(err) {
               throw err;
           }
           console.log(res.text);
           //console.dir(res.body.integrationNodes.integrationNode[0]);
           res.body.should.have.property("integrationNodes");
           res.body.integrationNodes.integrationNode[0].should.have.property("integrationServers");
           res.body.integrationNodes.integrationNode[0].integrationServers.should.have.property("type","integrationServers");
           res.body.integrationNodes.integrationNode[0].integrationServers.should.have.property("integrationServer");
           res.body.integrationNodes.integrationNode[0].integrationServers.integrationServer.should.be.array;
           res.body.integrationNodes.integrationNode[0].integrationServers.integrationServer[0].should.have.property("type","integrationServer");
           done();
      });
  });
});

