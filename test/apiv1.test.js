var assert = require("assert");//gives us basic assersions
var request = require('supertest');//gives us assertions on the http calls
var url  = 'http://localhost:3002';        

describe('apiv1', function(){
  this.timeout(60000);  
  it('should not barf',function(done){

      request(url)
       .get('/apiv1/integrationBus?depth=7')
       .end(function(err,res){
           if(err) {
               throw err;
           }
           done();
       });
  });


  it('should return an object 7 deep', function(done){

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

});

