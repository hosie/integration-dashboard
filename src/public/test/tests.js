
describe('IntegrationBus', function(){
  this.timeout(60000);

  it('should not barf',function(done){
      getIntegrationBus(function(error,integrationBus){
          done();          
      });
  });
});

describe('IntegrationNode', function(){
  this.timeout(60000);


  /* integration node fires an event every time one of its servers get a resource stats event , or their flows get a flow stats event*/
  it.skip('publishes every snapshot',function(done){
      getIntegrationBus(function(error,integrationBus){
          var integrationNode = integrationBus.integrationNodes.integrationNode[2];
          var seenSomeResourceStats=false;
          var seenSomeFlowStats=false;
          integrationNode.on('stats',function(stats){
              if(stats.ResourceStatistics != undefined) {
                  seenSomeResourceStats=true;
              }
              if(stats.MessageFlowStatistics != undefined) {
                  seenSomeFlowStats=true;
              }
              if(seenSomeResourceStats && seenSomeFlowStats) {
                  done();
              }

          });
          done();          
      });
  });  

});

describe('IntegrationServer', function(){
  this.timeout(60000);

  it.skip('publishes resource stats',function(done){
      getIntegrationBus(function(error,integrationBus){
          var integrationServer = integrationBus.integrationNodes.integrationNode[2].executionGroups.executionGroup[1];
          
          integrationServer.on('resourceStats',function(statsSnapShot){              
              statsSnapShot.should.have.property('ResourceStatistics');
              statsSnapShot.ResourceStatistics.should.have.property('ResourceType');
              statsSnapShot.ResourceStatistics.ResourceType.should.be.instanceof(Array).and.should.have.length(21);
              done();
          });
      });
  });

  it.skip('can stop a server',function(done){

      getIntegrationBus(function(error,integrationBus){
          var integrationServer = integrationBus.integrationNodes.integrationNode[2].executionGroups.executionGroup[0];
            integrationServer.stop(
              function(err){
                throw err;
              },
              function(){
                   console.dir(root);
                integrationServer.should.have.property('isRunning',false);
                done();
              });
      });
  });

  it.skip('can start a server',function(done){
      
      getIntegrationBus(function(error,root){
          
          var integrationServer = root.integrationNodes.integrationNode[2].executionGroups.executionGroup[0];
          integrationServer.onStart(function(){
              integrationServer.should.have.property('isRunning',true);
              done();
          });
          integrationServer.start(
              function(err){
                throw err;
              },
              function(){                
                
              });
      });
  });
});

describe('MessageFlow', function(){
  this.timeout(60000);
  it.skip('publishes flow stats',function(done){
      
      getIntegrationBus(function(error,root){
          
          var messageFlow = root.integrationNodes.integrationNode[2].executionGroups.executionGroup[0].applications.application[0].messageFlows.messageFlow[0];
          messageFlow.onAbort('messageFlowStatistics').onStart(function(){
              integrationServer.should.have.property('isRunning',true);
              done();
          });          
      });
  });
});
