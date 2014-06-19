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
var width  = 2000;
var height = 1000;
var bubbleToPortHoleRatio = 1.25;//major third
var portHoleRadius = 60;
var maxBubbleRadius = portHoleRadius/bubbleToPortHoleRatio;
var bubbleCenterRadius = portHoleRadius + maxBubbleRadius +20;
var center = {x:60,y:60};//TODO this needs to match the circles in the svg defs - can we link them at all so that I can change in one place?
//120 for the portal, 60 either side for EG bubbles, 15 padding
var integrationNodeWidth=2*portHoleRadius + 4*maxBubbleRadius +100;
var integrationNodeHeight=integrationNodeWidth;
function integrationNodeCenter(data,index){
    var x = ((integrationNodeWidth * index) + integrationNodeWidth/2);
    var y = integrationNodeHeight/2;    
    return {x:x,y:y};
}

initDashboard();

var svg = d3.select("svg")
    .attr("width", width)
    .attr("height", height);
var integrationNodeGroup=null;



function drawNodes(integrationNodes){

    
    addWidget(
        {            
            svgD3:  null,
            width:  integrationNodeWidth*integrationNodes.length,
            height: integrationNodeHeight,
            draw:   function(svg){
                       svgD3 = svg.append("g");
                                              
                       integrationNodeGroup = svgD3.selectAll(".integrationNode").data(integrationNodes)
                            .enter().append("g").attr("class","integrationNode")
                            .attr("transform", function(d,i){
                                var center = integrationNodeCenter(d,i);                                
                                return "translate(" + center.x +"," + center.y + ")";
                            });

                       integrationNodeGroup.append("use").attr("xlink:href", "#porthole")//learned this approach from  http://bl.ocks.org/explunit/5988971
                       .each(draggableElement)
                       .on("mouseup",function(d,i){
                           console.log(d.name);
                           toggleNodeBubbles(d,this);
                       });

                       integrationNodeGroup.append("text")
                       .attr("x",function(d,i){
                           return 60;
                       })
                       .attr("y",140)
                       .attr("class","integrationNodeLabel")
                       .attr("text-anchor","middle")
                       .text(function(d){return d.name;});

                       
                       
            }
    });
}

var pie = d3.layout.pie()
    .startAngle((3/8)*(Math.PI))
    .endAngle((13/8)*(Math.PI))
    .sort(null)
    .value(function(d) { return 1; });

bubbles = function() {
  var hierarchy = d3.layout.hierarchy(),
      size = [1, 1]; // width, height
}

function toggleNodeBubbles(d,node){
    console.dir(node);
    if(d.bubbleGroup === undefined) {
        d.bubbleGroup=d3.select(node.parentNode).append("g");
        var integrationServerGroup = d.bubbleGroup.selectAll(".orbitingCircle")
            .data(pie(d.executionGroups.executionGroup))
            .enter()
            .append("g")
            .each(function(d,i){
                this.draggableElement = draggableElement;
                this.draggableElement(d.data,i);
            });
        
        integrationServerGroup.attr("transform","translate(60,30),scale(0.1)");

        var bubble = integrationServerGroup.append("use")
            .attr("xlink:href", "#bubble")
            .attr("class","orbitingCircle")
            .attr("transform","scale(0.1)")
            ;

        
        var integrationServerLabel = integrationServerGroup.append("text")
            .attr("class","integrationServerLabel")            
            .text(function(d){
                //console.log("integration server label");
                //console.dir(d);
                return d.data.name;
            });

        //as the group moves, the bubble grows.  Text appears at the end of the transition        
        integrationServerGroup.transition()
            .delay(function(d,i){
                //console.log("delay for " + d.name + " is " + i*50);
                return i*50;            
            })            
            .attr("transform",function(d){
                var midAngle = d.startAngle + ((d.endAngle - d.startAngle)/2);//TODO can I not store this somewhere?  I am fed up calculating it
                var translateX = center.x + (bubbleCenterRadius * Math.sin(midAngle));
                var translateY = center.y + (bubbleCenterRadius * Math.cos(midAngle))
                return "translate("+translateX+","+translateY+")";
            })
            .attr("text-anchor",function(d){
                var midAngle = d.startAngle + ((d.endAngle - d.startAngle)/2);
                console.log("midAngle = " + midAngle);
                console.log("pi="+Math.PI);
                console.log("diff=",midAngle-Math.PI);

                if(midAngle-Math.PI>0.1) {

                    console.log("end");
                    return "end";
                }else if(midAngle-Math.PI<-0.1) {
                    console.log("start");
                    return "start";
                }
                else{
                    console.log("middle");
                    return "middle";
                }
            })
            ;
        bubble.transition()
            .delay(function(d,i){
                //console.log("delay for b" + d.name + " is " + i*50);
                return i*50;            
            })            
            .attr("transform",function(d){
                var midAngle = d.startAngle + ((d.endAngle - d.startAngle)/2);
                var r  = Math.min(maxBubbleRadius,bubbleCenterRadius * Math.sin(midAngle-d.startAngle));           
                //scale 
                return "scale("+r/100+")";
            })        
            ;
        
        integrationServerLabel
            .attr("transform",function(d){
                var midAngle = d.startAngle + ((d.endAngle - d.startAngle)/2);
                var r  = Math.min(maxBubbleRadius,bubbleCenterRadius * Math.sin(midAngle-d.startAngle));           
                var translateX = (r * Math.sin(midAngle));
                var translateY = -10 + (r * Math.cos(midAngle));
                return "translate("+translateX+","+translateY+")";
            })
            ;
        
        
    }else{        
        d.bubbleGroup.remove();
        d.bubbleGroup = undefined;
    }
}

getIntegrationBus( function(error, root) {
    
    drawNodes(root.integrationNodes.integrationNode);
});

function initDashboard(){
    $("body").droppable({
        accept:".observable",
        drop: function( event, ui ) {
            widgetFactory(ui.draggable.get(0).draggedData);            
      }
    }
    );

}

