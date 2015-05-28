/*
Copyright 2015
Author John Hosie 
 
  All rights reserved. This program and the accompanying materials
  are made available under the terms of the Eclipse Public License v1.0
  which accompanies this distribution, and is available at
  http://www.eclipse.org/legal/epl-v10.html
 
  Contributors:
      John Hosie - initial implementation 
*/



(function(){
  angular.module('iibWidgets',[])
    .factory('iibWidgetSpec',iibWidgetSpecFactory)
    .factory('d3Util',d3UtilFactory)
    .provider('iibIntegrationBus',iibIntegrationBusProviderFunction)
    .directive('iibFlowStats', ['$rootScope', 'd3Util',iibFlowStatsDirective])
    .directive('iibSunBurst', ['$rootScope', 'd3Util',iibSunBurstDirective])
    .directive('iibWidget',    ['$rootScope', 'd3Util',iibWidgetDirective])
    ;

  //TODO - is there a more angular way of making the widgetRegistry available to the widgets so that they can register themselves?
  //       Could make the widgets services or factories and use dependency inject, this would even work for widgets in separate modules  
  //       How would this affect the portability of the widgets to a non angular framework
  var widgetRegistry = {
    factories:[],
    /*
    Parms
      widgetFactory : function(canvas,data)
        Constructor function for widget 
          Parms
            canvas
            {
              svg    : a d3 selection containing the root SVG element for this widget
              height : the height, in pixels of the area allocated to draw this widget
              width  : the width, in pixels of the area allocated to draw this widget
            }
            data : an object, or array containing the data to be rendered by this widget. 
                   The structure of this parameter is determined by the map field of the factory
          Returns : an instance widget object          
            {
              init : function(canvas,data)
                Called once per widget object instance to initialise the D3 elements that will not vary
              draw : function(canvas,data)
                Called whenever the bound data changes.
            }
          Properties
            type        : (string) non-normalized name of the widget type, e.g. to be used in angular directives
            map         : function(IntegrationBus,options)
              Convert the IntegrationBus object to the format of data required. This can be a function provided, specifically for use with this widget or can be one of the general map functions provided by d3Util facotry
            TODO - probably need some way to indicate when to call renderDymanic - no point redrawing a chart for every publication if it is not renedering any data that was altered in that publication.  
                   This is purely a performance optimisation and would really only benefit charts that are static so maybe we just need to no-op the draw function if the chart is static
    */
    register:function(widgetFactory){
      this.factories[widgetFactory.type]=widgetFactory;
    },
    createWidget:function(type,options){
      var factory = this.factories[type];
      if(factory){
        var widget=new factory(options);
        widget.map=factory.map || function(integrationBus){return integrationBus;};
        return widget;
      }else{
        return null;
      }      
    }
  };

  /*Define the sun burst widget
  */
  (function(){
    // Interpolate the scales!
    
    
    var childrenAccessor=function(d){
        if(d.type==="MessageFlow")
        {
            return null;
        }else if (d.type==="Application")
        {
            return d.messageFlows;
        }else if((d.type==="IntegrationServer")||((d.type==="executionGroup"))){
            return d.applications;
        }else if((d.type==="IntegrationNode")||(d.type==="broker")){
            return d.integrationServers;
        }else if(d.type==="IntegrationBus"){
            return d.integrationNodes;
        }
        return null;
    };
    var valueFunction=function(d){
      if (d.snapshots && d.snapshots.length>0){
                
        //baseline at 0.1 seconds
        return 10 + d.snapshots[d.snapshots.length-1].WMQIStatisticsAccounting.MessageFlow.TotalCPUTime;
        
      }else{
        return 1;                
      }
      
    };
    var sunBurstWidget = function(options){
      return {
        aspectRatio : 1,
        init:function (canvas,data){
          this.radius = canvas.width/2;
          var x = d3.scale.linear()
            .range([0, 2 * Math.PI]);

          var y = d3.scale.sqrt()
            .range([0, this.radius]);
            
          var color = d3.scale.category20c();

              
          this.partition = d3.layout.partition()
            .value(valueFunction)
            .children(childrenAccessor);
            
          this.arc = d3.svg.arc()
            .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
            .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
            .innerRadius(function(d) { return Math.max(0, y(d.y)); })
            .outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });
                      
        },
        draw: function (canvas,data){
          if(this.svg){
            this.svg.remove();
          }          
          this.svg = canvas.svg
              .append("g")
              .attr("class","iib-sunburst")
              .attr("transform", "translate(" + this.radius + "," + this.radius  + ")");
          
          this.path = this.svg.selectAll("path").remove();
          this.pathSets = this.path.data(this.partition.nodes(data));
              
          this.pathSets.enter().append("path")
              .attr("d", this.arc)
              .attr("class", function(d) { 
                 return "iib-sunburst-" + d.type;
              })
              .on("click", click)
              .append("title")
              .text(function(d){
                if (d.type=="MessageFlow"){
                  return d.name + "(" + valueFunction(d) + ")";              
                }else{
                  return d.name;              
                  }
              });
          
          this.pathSets.exit().remove();
          var arc = this.arc;
          function arcTween(d) {
            var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
                yd = d3.interpolate(y.domain(), [d.y, 1]),
                yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
            return function(d, i) {
              return i
                  ? function(t) { return arc(d); }
                  : function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); return arc(d); };
            };
          }
          var path=this.path;
          function click(d) {
            path.transition()
              .duration(750)
              .attrTween("d", arcTween(d));
          }
              
        }
      }     
    };
    sunBurstWidget.type="iib-sun-burst";
    widgetRegistry.register(sunBurstWidget);
    
  })();
    
  /*  Define the flow stats widget and register it.
  */
  (function(){
          
    var timeFormatter;
    
    var flowStatsWidget = function(options){
      return {
        iibSimulation : options.iibSimulation || false,
        iibFlowName   : options.iibFlowName   || null,
        aspectRatio : 1,
        init:function (canvas,data){
          timeFormatter = d3.time.format("%X");
          
          this.maxY    = d3.max(data.map(function(item){
            return d3.max(item.map(function(item){
              return item.TotalInputMessages;
            }));
          }))||1;
            
          this.y         = d3.scale.linear()
                        .domain([0, this.maxY])
                        .range([canvas.height, 0]);

          this.yAxis = d3.svg.axis().scale(this.y)
                          .orient('left')
                          .ticks(5);

          var xMin = d3.min(data.map(function(item){
            return d3.min(item.map(function(item){
              var timeSubstring = item.EndTime.substring(0,8);
              var time=timeFormatter.parse(timeSubstring);
              return time;
            }));
          }))||new Date();
          var xMax = d3.max(data.map(function(item){
            return d3.max(item.map(function(item){
              return timeFormatter.parse(item.EndTime.substring(0,8));
            }));
          }))||new Date();
          
          //console.log("maxY=",this.maxY);
          this.x         = d3.scale.linear()
                      .domain([xMin, xMax])
                      .range([0, canvas.width]);

          this.yAxisGroup = canvas.svg.append('g')
              .attr('class', 'y axis')
              .attr('stroke','#777')
              .call(this.yAxis);

          var self=this;
          this.line    = d3.svg.line()
                          .interpolate('basis')
                          .x(function(d,i){
                            var xValue=self.x(timeFormatter.parse(d.EndTime.substring(0,8)));
                            return xValue;
                          })
                          .y(function(d,i){
                            var yValue = self.y(d.TotalInputMessages);
                            return yValue;
                          });
                          
          this.path=canvas.svg.selectAll(".dataLine");
          this.update = this.path.data(data);
          this.update.enter().append('svg:path')
                    .attr('class','dataLine')
                    .attr('d', this.line)
                    .attr('fill', 'none')
                    .attr('stroke-width', '1')
                    .attr('stroke','#000');
          this.update.exit().remove();
        },
        draw: function (canvas,data){

          var xMin = d3.min(data.map(function(item){
            return d3.min(item.map(function(item){
              var timeSubstring = item.EndTime.substring(0,8);
              var time=timeFormatter.parse(timeSubstring);
              return time;
            }));
          }))||new Date();
          var xMax = d3.max(data.map(function(item){
            return d3.max(item.map(function(item){
              return timeFormatter.parse(item.EndTime.substring(0,8));
            }));
          }))||new Date();
          
          this.x.domain([xMin, xMax]);
          this.maxY    = d3.max(data.map(function(item){
            return d3.max(item.map(function(item){
              return item.TotalInputMessages;
            }));
          }))||1;
          
          this.y.domain([0, this.maxY]);

          this.yAxis.scale(this.y);
          this.yAxisGroup.call(this.yAxis);
          canvas.svg.selectAll(".dataLine").remove();
          this.update = this.path.data(data);
          this.update.enter().append('svg:path')
                    .attr('class','dataLine')
                    .attr('d', this.line)
                    .attr('fill', 'none')
                    .attr('stroke-width', '1')
                    .attr('stroke','#000');
          this.update.exit().remove();


        }        
      }
    };
    flowStatsWidget.type="iib-flow-stats";
    flowStatsWidget.map=function(integrationBus){
        //return an array of arrays.
        // the inner array is the array of snapshots, the outer array contains one of those for each instance of the flow
        var flowName = this.iibFlowName;
        if(flowName==undefined) {
          return [[]];
        }
        else{
          var flowInstances = integrationBus.getFlowInstances(flowName);
          return flowInstances.map(function(flowInstance){ 
            return flowInstance.snapshots.map(function(snapshot){
              return snapshot.WMQIStatisticsAccounting.MessageFlow;
            });
          });
        }        
      };
    widgetRegistry.register(flowStatsWidget);
  })();
  
  /* Define the circle pack widget and register it.
  * 
  *    data is an IntegrationBus object
  *    topic is ...
  */
  (function(){
    var circlePackWidget = function(options){
     
      return {
        //TODO use IntegrationBus.js to get this data from a live bus or to get simulated data
        data:{
          type:"IntegrationBus",
          brokers:[
          {
            type:"IntegrationNode",
            name:"IntegrationNode1",
            executionGroups:{
              executionGroup:[
              {
                type:"IntegrationServer",
                name:"IntegtrationServer1",
                applications:{
                  application:[
                  {
                    type:"application",
                    name:"application1",
                    messageFlows:{
                      messageFlow:[
                      {
                        type:"messageFlow",
                        name:"MessageFlow1",
                        TotalCPUTime:300                        
                      },
                      {
                        type:"messageFlow",
                        name:"MessageFlow2",
                        TotalCPUTime:200                        
                      }
                      ]
                    }
                  }]
                }
              }]
            }
          }
          ]
          
        },
        iibSimulation:options.iibSimulation || false,
        aspectRatio : 1,
        init:function (canvas){
          
          //create a new d3 pack and 
          //set the accessor for data see - https://github.com/mbostock/d3/wiki/Pack-Layout#wiki-value
          //here we assume that the data will have a "size" field
          var diameter = canvas.height;
          var format   = d3.format(",d");
          var pack     = d3.layout.pack()
          .size([diameter - 4, diameter - 4])
          .sort(null)
          .value(function(d) { 
              if( d ==  undefined) {
                  return 1;
              }
              if( d.TotalCPUTime ==  0) {
                  return 1;
              }
              return d.TotalCPUTime; 
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
          //TODO figure out a better way to update the data and re-draw the visuals
          var rootGroup = canvas.svg.append("g");

          var nodeRoot = rootGroup.datum(this.data);
          
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
            return d.name + (d.type !== "messageFlow" ? "" : ": " + format(d.TotalCPUTime)); 
          });

          newNode.append("circle")            
          .each(function(d,i){
            if(d.type=="messageFlow") {
            }
                  
            //d3.select(this).each(draggableElement);
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
        },
        draw: function (canvas){
          
        }        
      }
    };
    circlePackWidget.type="iib-circle-pack";
    widgetRegistry.register(circlePackWidget);
  })();  

  function d3UtilFactory(iibIntegrationBus){
    var Canvas = function(element, options){
      this.element=element;
      this.options=options;
      this.remove=function(){};//remove() function is re-initialised later, in init()
      this.reload=function(){
        this.remove();
        this.init()
        
      };
      this.init=function(){
        var fullWidth = d3.select(this.element).node().offsetWidth;
      
        //responsive. max margins at these numbers but respond to smaller element sizes with a margin as a fraction of element size
        var margin = {
          right : Math.min(80,0.1*fullWidth),
          left : Math.min(80,0.1*fullWidth)
        };
        this.width = fullWidth - margin.left - margin.right;
        var fullHeight;
        
        if(this.options.aspectRatio) {
          this.height = this.width * this.options.aspectRatio;
          margin.bottom = Math.min(20,0.1*this.height);
          margin.top    = Math.min(10,0.05*this.height);
          fullHeight    = this.height + margin.top + margin.bottom;
        }else{      
          fullHeight = Math.max(200,d3.select(this.element).node().offsetHeight);
          margin.bottom = Math.min(20,0.1*fullHeight);
          margin.top    = Math.min(10,0.05*fullHeight);
          this.height = fullHeight - margin.top - margin.bottom;
        }

        rootSvg = d3.select(this.element) 
        .append('svg') 
        .style('width', fullWidth) 
        .style('height', fullHeight) 
        .attr('class', 'iib-chart');

        this.svg = rootSvg
        .append("g") 
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
        //initialise the remove() function here so that we do not need to store rootSvg as a property on the object
        //and risk any consumers of that object from accidentally accessing it
        this.remove=function(){
          rootSvg.remove();          
        }        
      }
      
    };
    function createCanvas(element, options) {
        var canvas = new Canvas(element,options);
        canvas.init();
        return canvas;
  	  
    }

    function renderWidget(widget,iElement){
      var canvasOptions = {
        aspectRatio : widget.aspectRatio
      };
      var canvas = createCanvas(iElement[0],canvasOptions);
      iibIntegrationBus.ready(function(err,integrationBus){
      
        var data = widget.map(integrationBus);
            
        widget.init(canvas,data);
        widget.draw(canvas,data);
        integrationBus.integrationNodes.forEach(function(integrationNode){
          integrationNode.on('messageFlowStats',function(){
            var data = widget.map(integrationBus);          
            widget.draw(canvas,data);          
          });          
        });        
      });
      return {
        remove:function(){
          canvas.remove();
          //TODO unsubscribe to flow stats
        },
        reload:function(){
          canvas.reload();                 
        }
      }
    }
    return {
      renderWidget:renderWidget      
      
    }
  }
 
  function iibWidgetDirective($rootScope,d3Util){
    var iibSubscriber=iibSubscriber;
    return {
      restrict: 'AC',
      scope:{
        iibWidgetType:'@',
        iibAttributes:'='
      },
      link: link
    };
    
    function link(scope,iElement,iAttrs){
      var widget=widgetRegistry.createWidget(scope.iibWidgetType ,scope.iibAttributes | {} );      
      d3Util.renderWidget(widget,iElement);      
    };
  };

  function iibFlowStatsDirective($rootScope,d3Util){
    var iibSubscriber=iibSubscriber; 
    return {
      restrict: 'AC',
        //TODO - can we derive these scope attributes from the widgetSpec factory?
      scope:{
        iibFlowName:'@',
        iibMqttHost:'@',
        iibMqttPort:'@',
        iibSimulation:'@'
      },
      link: link
    };

    function link(scope,iElement,iAttrs){

      
      var widget    = widgetRegistry.createWidget("iib-flow-stats",scope);
      var rendering = d3Util.renderWidget(widget,iElement);
      
      scope.$watch(
        function(){
          return scope.iibFlowName;        
        },
        function(newValue,oldValue){
          if(newValue===oldValue){
            //do nothing
          }else{          
            rendering.remove();
            widget    = widgetRegistry.createWidget("iib-flow-stats",scope);
            rendering = d3Util.renderWidget(widget,iElement);
          }
        }
      );
    }
  }

  function iibSunBurstDirective($rootScope,d3Util){
    var iibSubscriber=iibSubscriber; 
    return {
      restrict: 'AC',
        //TODO - can we derive these scope attributes from the widgetSpec factory?
      scope:{
        iibFlowName:'@',
        iibMqttHost:'@',
        iibMqttPort:'@',
        iibSimulation:'@'
      },
      link: link
    };

    function link(scope,iElement,iAttrs){
      var widget=widgetRegistry.createWidget("iib-sun-burst",scope);
      
      d3Util.renderWidget(widget,iElement);      
    }    
  }

  function iibWidgetSpecFactory(){
    var textType={
      isText:function(){
        console.log("isText");
        return true;
      }
    };        
    return {
      widgets:[
        {
          id          : "iib-flow-stats" ,
          name        : "Througput",
          description : "Messages per second line graph",
          preview     : "images/throughput.png",
          attributes:[
            {
              type:textType,
              name:"flowName",
              id : "iib-flow-name"

            },
            {
              type:textType,        
              name:"Simulation",
              id : "iib-simluation"
            },
            {
              type:textType,        
              name:"Host",
              id : "iib-simluation"
            },
            {
              type:textType,        
              name:"Port",
              id : "iib-simluation"
            }
          ]
        },
        {
          id:"iib-cpu-circles",
          name:"CPU",
          description:"Message flow, application and integration server CPU utilisation circle pack",
          preview:"images/cpuCircles.png"
        },
        {
          id:"iib-something",
          name:"Something",
          description:"lorem ipsum",
          preview:"images/something.png"
        },
        {
          id:"iib-something-else",
          name:"Something else",
          description:"This one moves",
          preview:"images/somethingElse.gif"
        }
      ],
      getWidget:function(id,callback){
        console.log("getWidget " + id);
        var widget;
        this.widgets.forEach(function(item){
          if(item.id==id) {
            callback(item);
          }
          widget=item;
        });
        if(widget==undefined) {
          callback(null);
        }
      }
    };   
  }
  
  function iibIntegrationBusProviderFunction(){
    this._simulate=false;
    this.simulate=function(doSimulate){
      this._simulate=doSimulate;
    };
    this.$get=function(){      
      //TODO inject paho
      var integrationBus = {
        obj:null,
        waiters:[],
        ready:function(callback){        
          if(this.obj!=null){
            callback(null,this.obj);
          }else{
            this.waiters.push(callback);          
          }
        }
      };
      function onLoad(err,obj){
        integrationBus.obj=obj;
        integrationBus.waiters.forEach(function(waiter){
          waiter(err,obj);
        });
        integrationBus.waiters=[];
      }
      if(this._simulate) {
        window.Integration.simulateIntegrationBus(onLoad);
      }else{
        window.Integration.getIntegrationBus(onLoad);
      }
      return integrationBus;
    };        
  }
})();

