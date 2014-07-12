/*
Copyright 2014 
Author John Hosie 
 
  All rights reserved. This program and the accompanying materials
  are made available under the terms of the Eclipse Public License v1.0
  which accompanies this distribution, and is available at
  http://www.eclipse.org/legal/epl-v10.html
 
  Contributors:
      John Hosie - initial implementation 
*/
registerWidgetFactory(["IntegrationNode","broker"],function(){
    return {
        name:"Broker circle pack",            
        scalable:true,
        scrollable:false,
        height:400,
        width:400,
        draw:function (svg,data){
          //create a new d3 pack and 
          //set the accessor for data see - https://github.com/mbostock/d3/wiki/Pack-Layout#wiki-value
          //here we assume that the data will have a "size" field
          var diameter=this.height;
          var format = d3.format(",d");
          var pack = d3.layout.pack()
          .size([diameter - 4, diameter - 4])
          .sort(null)
          .value(function(d) { 
              if( d.currentSnapShot ==  undefined) {
                  return 1;
              }
              if( d.currentSnapShot.TotalCPUTime ==  0) {
                  return 1;
              }
              return d.currentSnapShot.TotalCPUTime; 
           })
          .padding(2)
          .children(function(d){
              if(d.type==="messageFlow")
              {
                  return null;
              }else if (d.type==="application")
              {
                  return d.messageFlows.messageFlow;
              }else if((d.type==="IntegrationServer")||((d.type==="executionGroup"))){
                  return d.applications.application;
              }else if((d.type==="IntegrationNode")||(d.type==="broker")){
                  return d.executionGroups.executionGroup;
              }else if(d.type==="IntegrationBus"){
                  return d.brokers;
              }
              return null;
          });
          

          var rootSvg = null;
          data.addListener(
              function(currentSnapShot){


                   //TODO figure out a better way to update the data and re-draw the visuals
                   if(rootSvg!=null){
                       rootSvg.remove();
                   }
                   rootSvg=svg.append("g");


                var nodeRoot = rootSvg.datum(data);
                
                var node = nodeRoot.selectAll(".node")
                   //let the visuals see the data
                  .data(pack.nodes);

                var newNode = node.enter().append("g")
                    .attr("class", function(d) { 
                          var clazz = (d.type!=="messageFlow") ? "node" : "leaf node"; 
                          return clazz;
                    })
                    .attr("transform", function(d) { 
                        return "translate(" + d.x + "," + d.y + ")"; 
                    });

                
                newNode.append("title")
                    .text(function(d) { 
                      return d.name + (d.type !== "messageFlow" ? "" : ": " + format(d.currentSnapShot.TotalCPUTime)); 
                    });

                newNode.append("circle")            
                    .each(function(d,i){
                        if(d.type=="messageFlow") {
                        }
                        
                        d3.select(this).each(draggableElement);
                    })
                    .attr("r", function(d) {             
                        return d.r;
                    });

                //make the top level nodes clickable and show their name
                node.filter(function(d) { return d.depth <2 })
                    .append("text")
                    .attr("dy", ".3em")
                    .style("text-anchor", "middle")      
                    .text(function(d) { return d.type === "IntegrationBus" ? "" : d.name.substring(0, d.r / 3); })
                    ;

                node.exit().remove();
        
              });
        }
    };
});

function parseTime(time){
    var parseDateFormat = d3.time.format("%H:%M:%S");
    //strip off the microsecond
    //d3 can only handle milliseconds but I can't be bothered rounding micro to mili, there is no point, easier to round to seconds
    
    var trimmedTime = time.substring(0,time.indexOf('.'));
    return parseDateFormat.parse(trimmedTime);

}
registerWidgetFactory(["messageFlow"],function(){
    return {
          name:"Flow stats",            
          scalable:true,
          scrollable:false,
          height:200,
          width:600,
          draw:function(svg,messageFlow){
            
            var x;
            var y;
            var xAxis;
            var yAxis;
            var margin = {top: 20, right: 20, bottom: 30, left: 50},
              width = this.width - margin.left - margin.right,
              height = this.height - margin.top - margin.bottom;

           x = d3.time.scale()
              .range([0, width]);

           y = d3.scale.linear()
              .range([height, 0]);

           xAxis = d3.svg.axis()
              .scale(x)
              .orient("bottom");

           yAxis = d3.svg.axis()
              .scale(y)
              .orient("left");

           var line = d3.svg.line()
              .x(function(d) {                         
                 return x(parseTime(d.MessageFlow.EndTime)); 
              })
              .y(function(d) {
                 return y(d.MessageFlow.TotalInputMessages);
              })
              .interpolate("basis");

            xg = svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            yg = svg.append("g")
                .attr("class", "y axis")
                .call(yAxis)
              .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text("Messages");

            
            var path;

            messageFlow.onUpdate(function(payloadObj){//TODO should the util function maintain the array of historical data?

               
                x.domain(d3.extent(messageFlow.historicStats, function(d) {                     
                    return parseTime(d.MessageFlow.EndTime);
                 }));

                y.domain(d3.extent(messageFlow.historicStats, function(d) { return d.MessageFlow.TotalInputMessages; }));

                xAxis(xg);
                yAxis(yg);

                if(path!=null) {
                    path.remove();
                }

                path = svg.append("path")
                    .datum(messageFlow.historicStats)
                    .attr("class", "line")
                    .attr("d", line);

            });
        }
    };
});

registerWidgetFactory(["IntegrationServer","executionGroup"],function(){
    return {
        name:"Resource Stats",
        scalable:true,
        scrollable:false,
        height:400,
        width:400,
        rootGroup:null,
        draw:function (svg,executionGroup){    
          this.svg=svg;
          
          var me = this;
          executionGroup.getResourceManagers(function(resourceManagers){
              if(me.rootGroup!=null) {
                  
                  me.rootGroup.remove();
              }
              me.rootGroup = me.svg.append("g");

              var newResourceType = me.rootGroup.selectAll(".resourceType")//TODO should there be a naming convention for these classes so that they can be unique to the widget?  Or common?
              .data(resourceManagers)
              .enter().append("g")        
              .each(draggableElement);

              var widgetWidth = me.width;

              newResourceType.append("rect")
              .attr("class","resourceType")
              .attr("width",100)
              .attr("height",100)
              .attr("x",function(d,i){
                  //TODO move this into a layout?
                  var myWidth=100;
                  return (i*myWidth) % widgetWidth;
              })
              .attr("y",function(d,i){
                  //TODO move this into a layout?
                  var myHeight=100;
                  var myWidth=100;
                  return myHeight * Math.round(( i*myWidth / widgetWidth)-0.5);
              });
              newResourceType.append("text")
              .text(function(d){
                  return d.name;
              })
              .attr("class","resourceTypeLabel")
              .attr("x",function(d,i){
                  var myWidth=100;
                  return  3 + (i*myWidth) % widgetWidth;
                  
              })
              .attr("y",function(d,i){
                  //TODO move this into a layout?
                  var myHeight=100;
                  var myWidth=100;
                  return 30 + ( myHeight * ( Math.round(( i*myWidth / widgetWidth)-0.5)));
              });          
          });
        }
    };
});

registerWidgetFactory(["resourceType"],function(){
    return {
        name:"Resource Stats Table",            
        scalable:true,
        scrollable:false,
        height:400,
        width:400,
        draw:function (svg,resourceType){

          var rootGroup = svg.append("g");
          listenToStats(resourceType,onError,function(stats){
            var thisStats;
            stats.ResourceStatistics.ResourceType.forEach(function(item){
                if(item.name==resourceType.name){
                    thisStats=item;
                }
            });
            rootGroup.remove();
            rootGroup = svg.append("g");
            
            var keys=Object.keys(thisStats.resourceIdentifier[0]);
            //learned this approach from http://svg-whiz.com/svg/table.svg

            //first add colum headings
            var headerRow = rootGroup
                            .append("text")
                            .attr("class","resourceStatsTableHeader")
                            .attr("x",30)
                            .attr("y",30)
                            .attr("text-anchor","middle");
            var xPos=30;
            keys.forEach(function(item){
                headerRow
                    .append("tspan")
                    .attr("x",xPos)
                    .text(item);
                xPos=xPos+100;
            });

            //now create the rows from the data
            var dataRows = rootGroup
                .append("g")            
                .selectAll("text")
                .data(thisStats.resourceIdentifier);
                

            dataRows
                .enter()
                .append("text")
                .attr("x",30)
                .attr("y",30)
                .call(function(newRow){
                    //each row has a column for each key that we found earlier
                    //use keys to reference the value, rather than index in case they come out in different order
                    //make sure that name is the first column
                    newRow
                        .append("tspan")
                        .attr("class","resourceStatsTableRowTitle")
                        .attr("x",30)
                        .attr("dy",function(d,i){return 30*(i+1);})
                        .text(function(d,i){
                            return d.name;
                        });
                    xPos=100;
                    
                    keys.forEach(function(item){
                        if(item!="name") {                    
                            newRow
                                .append("tspan")                            
                                .attr("class","resourceStatsTableValue")
                                .attr("x",xPos)                            
                                .text(function(d,i){
                                    return d[item];
                                });
                        }
                        xPos=xPos+100;
                    });
                });
          });
        }
    };
});
