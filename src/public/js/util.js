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

var factories={};

function registerWidgetFactory(objectTypes,widget){
    objectTypes.forEach(function(item){
        if(factories[item] ==undefined){
            factories[item]=[];
        }
        factories[item].push(widget);
    });

}

function widgetFactory(data){

    var possibleWidgets = factories[data.type];
    if(possibleWidgets!=undefined) {
        //TODO - allow the user to choose rather than just pick the first to be registered
        var newWidget = new possibleWidgets[0]();
        addWidget(newWidget,data);
    }

    
}

//this shoudl really be a method on dashboard object
//widgets
//   Drag to position
function addWidget(widget,data){
    //adds the widget object to the current dashboard
    //wdiget is assumed to have a resize method and a draw method
    //the current dashboard is a div with the id of #dashboard.  TODO - need another solution for multiple dashboards 
    var dashboardDiv= $("#dashboard");
    var widgetDiv = dashboardDiv.append("<div></div>").children(":last");
    var svg = d3.select(widgetDiv.get(0)).append("svg").append("g")
            .attr("width", widget.width)
            .attr("height", widget.height);
    
    var widgetContainer = {
        //create our drawing canvas      
      svg: svg,
      jq : widgetDiv,
      dom : widgetDiv.get(0),
      widget : widget,
      resize: function(rectangle){

                   var scaleFactor;
                   if(widget.scrollable == true) {
                       //scale up to file the area, scrolling is allowed so ok to go off canvas in one dimension
                       scaleFactor = Math.max(rectangle.height/this.widget.height,rectangle.width/this.widget.width);
                   }else{
                       scaleFactor = Math.min(rectangle.height/this.widget.height,rectangle.width/this.widget.width);
                   }
                   svg.attr("transform","scale("+scaleFactor+")");
                   
      }

    };

    widgetContainer.jq.addClass("ui-widget-content");
    widgetContainer.jq.draggable();
    widgetContainer.jq.resizable({
        resize: function( event, ui ) {
            widgetContainer.height=ui.size.height;
            widgetContainer.width=ui.size.width;
            widgetContainer.resize(ui.size);                       
        }
    });    
    widgetContainer.jq.css("width",widget.width);
    widgetContainer.jq.css("height",widget.height);

    //steal anything that gets dropped in the vicinity of this widget.    
    widgetContainer.jq.droppable({ greedy: true,
        drop: function( event, ui ) {        
              //no-op
        }
    });
    widget.draw(widgetContainer.svg,data);
}

function draggableElement(d,i){
    //TODO make this a method on an object?    
    
    var clonesvg;
    var originalNode = this;
    originalNode.draggedData=d;
    
    //D3 seems to be better than jq at adding classes to svg elements
    d3.select(originalNode).classed("observable",true);
    
    $(originalNode).draggable({
           revert: "invalid", // when not dropped, the item will revert back to its initial position
           containment: "document",           
           cursor: "move"
    })
    .on('dragstart', function(event, ui){
        clonesvg = d3.select("body").append("svg")
            .attr("opacity","0.5")
            .style("position","absolute")
            .classed("observable",true);

        d3.select(clonesvg.node().appendChild(originalNode.cloneNode(true)))
        .attr("transform","translate(0,0)");
        
    })
    .on('drag', function(event, ui){
        // update coordinates manually, since top/left style props don't work on SVG
        var x=event.pageX;//ui.position.left
        var y = event.pageY;//ui.position.top
        
        clonesvg.style('top', y);        
        clonesvg.style('left', x);
        
    })
    .on('dragstop',function(event,ui){
        clonesvg.remove();

    });
}


function onError(message){
    alert("Error:" + message);
    throw message;
}
