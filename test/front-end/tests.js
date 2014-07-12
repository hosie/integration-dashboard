var apiv1Stub;
beforeEach(function(done){
    apiv1Stub = APIv1Stub();
    done();
});

afterEach(function(done){
    apiv1Stub.restore();
    done();
});

describe('IntegrationBus', function(){
    it('should not barf',function(done){
      getIntegrationBus(function(error,integrationBus){
            integrationBus.should.have.property('type','IntegrationBus');
            if(error==null) {
                done();          
            }else{
                throw error;
            }
      });      
    });
});



describe('IntegrationNode', function(){
  this.timeout(60000);
  var integrationNode;
  beforeEach(function(done){
        getIntegrationBus(function(error,integrationBus){
            if(error!=null) {
                throw error;
            }
            integrationNode=integrationBus.integrationNodes.integrationNode[0];
            done();
        });    
  });

  it.skip('should be an IntegrationNode',function(){      
      integrationNode.should.have.property('type','IntegrationNode');
  });  


  /* integration node fires an event every time one of its servers get a resource stats event , or their flows get a flow stats event*/
  it.skip('publishes every snapshot',function(done){
      
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

describe('IntegrationServer', function(){
  this.timeout(60000);

  var integrationServer;
  beforeEach(function(done){
        getIntegrationBus(function(error,integrationBus){
            if(error!=null) {
                throw error;
            }
            integrationServer = integrationBus.integrationNodes.integrationNode[0].executionGroups.executionGroup[0];
            done();
        });    
  });

  it.skip('publishes resource stats',function(done){
      
      integrationServer.on('resourceStats',function(statsSnapShot){              
          statsSnapShot.should.have.property('ResourceStatistics');
          statsSnapShot.ResourceStatistics.should.have.property('ResourceType');
          statsSnapShot.ResourceStatistics.ResourceType.should.be.instanceof(Array);
          done();
      });
      
  });

  it.skip('can stop a server',function(done){

      
      
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

  it.skip('can start a server',function(done){
      
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

describe('MessageFlow', function(){
  this.timeout(25000);

  var messageFlow;
  beforeEach(function(done){
      getIntegrationBus(function(error,integrationBus){
          if(error!=null) {
              throw error;
          }
          messageFlow = root.integrationNodes.integrationNode[0].executionGroups.executionGroup[0].applications.application[0].messageFlows.messageFlow[0];
          done();
      });    
  });


  it.skip('get an instance of message flow',function(done){      
      messageFlow.should.be.instanceOf(MessageFlow);
  });

  it.skip('publishes flow stats',function(done){
      
      messageFlow.on('messageFlowStats',function(statsSnapShot){
          statsSnapShot.should.have.property('WMQIStatisticsAccounting');
          statsSnapShot.WMQIStatisticsAccounting.should.have.property('MessageFlow');              
          done();
      });                
  });
});
