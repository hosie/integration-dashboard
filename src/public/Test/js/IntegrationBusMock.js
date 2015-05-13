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
        on:function(event,callback){
          if(event=='messageFlowStats'){
            
          }else if (event=='resourceStats'){
            
          }
          
        },
        integrationServers:[
        {
          type:"IntegrationServer",
          name:"MyIntegrationServer",
          on:function(event,callback){
            if (event=='resourceStats'){
              
            }
            //TODO onStop
            
          },
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
              on:function(){
                
              },
              stats:[]
            }],
            //TODO integrationNode
            on:function(eventType,callback){
              if(eventType=='messageFlowStats'){
                                  
              }
            }
          }]          
        }]
      }]
    };
    return {
      getIntegrationBus:function(){
        return integrationBus;
      }
    }
})();
