
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

  it.skip('get an instance of IntegrationNode',function(done){
      var integrationNode = integrationBus.integrationNodes.integrationNode[0];
      integrationNode.should.be.instanceOf(IntegrationNode);
  });


  /* integration node fires an event every time one of its servers get a resource stats event , or their flows get a flow stats event*/
  it.skip('publishes every snapshot',function(done){
      getIntegrationBus(function(error,integrationBus){
          var integrationNode = integrationBus.integrationNodes.integrationNode[0];
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
          var integrationServer = integrationBus.integrationNodes.integrationNode[0].executionGroups.executionGroup[0];
          
          integrationServer.on('resourceStats',function(statsSnapShot){              
              statsSnapShot.should.have.property('ResourceStatistics');
              statsSnapShot.ResourceStatistics.should.have.property('ResourceType');
              statsSnapShot.ResourceStatistics.ResourceType.should.be.instanceof(Array);
              done();
          });
      });
  });

  it.skip('can stop a server',function(done){

      getIntegrationBus(function(error,integrationBus){
          var integrationServer = integrationBus.integrationNodes.integrationNode[0].executionGroups.executionGroup[0];
          integrationServer.on('stop',function(){
              integrationServer.should.have.property('isRunning',false);
              done();
          });
          integrationServer.stop(
              function(err){
                throw err;
              },
              function(){
              });
      });
  });

  it.skip('can start a server',function(done){
      
      getIntegrationBus(function(error,root){
          
          var integrationServer = root.integrationNodes.integrationNode[0].executionGroups.executionGroup[0];
          integrationServer.on('start',function(){
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
  this.timeout(25000);
  it.skip('get an instance of message flow',function(done){
      var messageFlow = root.integrationNodes.integrationNode[0].executionGroups.executionGroup[0].applications.application[0].messageFlows.messageFlow[0];
      messageFlow.should.be.instanceOf(MessageFlow);
  });

  it('publishes flow stats',function(done){
      
      getIntegrationBus(function(error,root){
          
          var messageFlow = root.integrationNodes.integrationNode[0].executionGroups.executionGroup[0].applications.application[0].messageFlows.messageFlow[0];
          messageFlow.on('messageFlowStats',function(statsSnapShot){
              statsSnapShot.should.have.property('WMQIStatisticsAccounting');
              statsSnapShot.WMQIStatisticsAccounting.should.have.property('MessageFlow');              
              done();
          });          
      });
  });
});
