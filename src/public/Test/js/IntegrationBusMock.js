Integration=(function(){
  var integrationBus=
   {
      type:"IntegrationBus",
      on:function(eventType,options,callback){
        setInterval(function(){
          integrationBus
            .integrationNodes[0]
            .integrationServers[0]
            .applications[0]
            .messageFlows[0]
            .stats
            .push( {
                      EndTime:new Date() ,
                      TotalInputMessages:15 + Math.floor((Math.random() * 10) + 1)  
                    });
          
          callback();
        },2000)
      },
      integrationNodes:[
      {
        type:"IntegrationNode",
        name:"NodeA",
        integrationServers:[
        {
          type:"IntegrationServer",
          name:"Server1",
          
          //TODO stop/start
          applications:[          
          {
          
            type:"Application",
            name:"MyApplication",
            //TODO integrationNode:
            messageFlows:[
            {
              type:"MessageFlow",
              name:"MyMessageFlow",
              
              stats:[]
            }],
            //TODO integrationNode
            
          }]          
        },
        {
          type:"IntegrationServer",
          name:"Server2",
          
          //TODO stop/start
          applications:[          
          {
          
            type:"Application",
            name:"MyApplication",
            //TODO integrationNode:
            messageFlows:[
            {
              type:"MessageFlow",
              name:"MyMessageFlow",
              
              stats:[]
            }],
            //TODO integrationNode
            
          },
          {
          
            type:"Application",
            name:"AnotherApp",
            //TODO integrationNode:
            messageFlows:[
            {
              type:"MessageFlow",
              name:"MyMessageFlow",
              
              stats:[]
            }],
            //TODO integrationNode
            
          }
          ]          
        }
        ]
      },
      {
        type:"IntegrationNode",
        name:"NodeB",
        integrationServers:[
        {
          type:"IntegrationServer",
          name:"MyIntegrationServer",
          
          //TODO stop/start
          applications:[          
          {
          
            type:"Application",
            name:"MyApplication",
            //TODO integrationNode:
            messageFlows:[
            {
              type:"MessageFlow",
              name:"MyMessageFlow",
              
              stats:[]
            }],
            //TODO integrationNode
            
          }]          
        }]
      }
      ]
    };
    integrationBus.integrationNodes.forEach(function(integrationNode){
      integrationNode.on=function(event,callback){
        if(event=='messageFlowStats'){            
        }else if (event=='resourceStats'){            
        }          
      };
      integrationNode.integrationServers.forEach(function(integrationServer){
        integrationServer.on=function(event,callback){
          if (event=='resourceStats'){
            
          }
          //TODO onStop          
        };
        integrationServer.applications.forEach(function(application){
          application.on=function(eventType,callback){
            if(eventType=='messageFlowStats'){
                                
            }
          };
          application.messageFlows.forEach(function(messageFlow){
            messageFlow.on=function(){
                
            };
            
          });
                    
        });        
      });
    });
    return {
      getIntegrationBus:function(){
        return integrationBus;
      }
    }
})();
