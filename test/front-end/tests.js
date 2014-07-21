/*var apiv1Stub;
beforeEach(function(done){
    apiv1Stub = APIv1Stub();
    done();
});

afterEach(function(done){
    apiv1Stub.restore();
    done();
});
*/
describe('IntegrationBus', function(){
    this.timeout(30000);
    it('should not barf',function(done){
      Integration.getIntegrationBus(function(error,integrationBus){
            integrationBus.should.have.property('type','IntegrationBus');
            integrationBus.should.be.instanceof(IntegrationBus);
            if(error==null) {
                done();          
            }else{
                throw error;
            }
      });      
    });    
});



describe('IntegrationNode', function(){
  this.timeout(30000);
  var integrationNode;
  beforeEach(function(done){
        Integration.getIntegrationBus(function(error,integrationBus){
            if(error!=null) {
                throw error;
            }
            integrationNode=integrationBus.integrationNodes[0];
            done();
        });    
  });

  it('should be an IntegrationNode',function(){      
      integrationNode.should.have.property('type','IntegrationNode');
      integrationNode.should.have.property('name');
      integrationNode.should.be.instanceof(IntegrationNode);

  });  


  /* integration node fires an event every time one of its servers get a resource stats event , or their flows get a flow stats event*/
  it('publishes every message flow stats snapshot',function(done){      
      integrationNode.on('messageFlowStats',function(stats){
          if(stats.WMQIStatisticsAccounting != undefined) {
              done();
          }
      });      
  });

  it.skip('publishes every resource stats snapshot',function(done){      
      integrationNode.on('resourceStats',function(stats){
          if(stats.ResourceStatistics != undefined) {
              done();
          }
      });      
  });
});

describe('IntegrationServer', function(){
  this.timeout(60000);

  var integrationServer;
  var integrationNode;
  beforeEach(function(done){
        Integration.getIntegrationBus(function(error,integrationBus){
            if(error!=null) {
                throw error;
            }
            integrationNode=integrationBus.integrationNodes[0];
            integrationServer = integrationNode.integrationServers[0];
            done();
        });    
  });

  it('should be an IntegrationServer',function(){      
      integrationServer.should.have.property('type','IntegrationServer');
      integrationServer.should.have.property('name');
      integrationServer.should.be.instanceof(IntegrationServer);

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

  it('can get integration node',function(){
      integrationServer.getIntegrationNode().should.equal(integrationNode);
  });
});


describe('Application', function(){
  this.timeout(25000);

  var application;
  var integrationNode;
  beforeEach(function(done){
      Integration.getIntegrationBus(function(error,integrationBus){
          if(error!=null) {
              throw error;
          }
          integrationNode=integrationBus.integrationNodes[0];
          application = integrationNode.integrationServers[0].applications[0];
          done();
      });    
  });


  it('should be an Application',function(){      
      application.should.have.property('type','Application');
      application.should.have.property('name');
      application.should.be.instanceof(Application);
  });  

  it('can get integration node',function(){
      application.getIntegrationNode().should.equal(integrationNode);
  });
});

describe('MessageFlow', function(){
  this.timeout(25000);

  var messageFlow;
  var integrationNode;
  beforeEach(function(done){
      Integration.getIntegrationBus(function(error,integrationBus){
          if(error!=null) {
              throw error;
          }
          integrationNode=integrationBus.integrationNodes[0];
          messageFlow = integrationNode.integrationServers[0].applications[0].messageFlows[0];
          done();
      });    
  });

  it('get an instance of message flow',function(){      
      messageFlow.should.have.property('type','MessageFlow');
      messageFlow.should.have.property('name');
      messageFlow.should.be.instanceOf(MessageFlow);      
  });

  it('publishes flow stats',function(done){
      
      messageFlow.on('messageFlowStats',function(statsSnapShot){
          statsSnapShot.should.have.property('WMQIStatisticsAccounting');
          statsSnapShot.WMQIStatisticsAccounting.should.have.property('MessageFlow');              
          done();
      });                
  });

  it.skip('should hanlde mqtt failures',function(){      
      
  });

  it('can get integration node',function(){
      messageFlow.getIntegrationNode().should.equal(integrationNode);
  });
});
