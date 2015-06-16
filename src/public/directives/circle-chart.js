(function(){
    
  function CircleChart(options){
    return {
      aspectRatio : 1,
      center      : true,
      init:function (canvas,data,util,emit){
        this.color = d3.scale.linear()
            .domain([-1, 3])
            .range(["hsl(152,80%,0%)", "hsl(228,30%,70%)"])
            .interpolate(d3.interpolateHcl);

        this.pack = d3.layout.pack()
            .padding(2)
            .size([canvas.width, canvas.height])
            .children(util.children)
            .value(function(d) {
                if (d.snapshots && d.snapshots.length>0){                
                  return 10 + d.snapshots[d.snapshots.length-1].WMQIStatisticsAccounting.MessageFlow.TotalCPUTime;
                  
                }else{
                  return 1;
                  
                }
            });
        
        //TODO should this really be done in css or set by the containing app?
        canvas.svg.style("border-radius","50px");
        this.svg = canvas.svg.append("g")
                    .attr("id", "circle");
        this.focus = data;

      },
      draw: function (canvas,root,emit){
        var self=this;
        
        var nodes = this.pack.nodes(root),
                view;
        
        
        this.svg.selectAll("circle")
            .data(nodes)
            .enter().append("circle");
            
        this.svg.selectAll("circle")
            .attr("class", function(d) {
                return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root";
            })
            .attr("id", function(d) {
                return d.id;
            })
            .attr("value", function(d) {
                return d.name
            })
            .attr("parent", function(d) {
                if (d.parent) return d.parent['id']
            })/*.
            .attr("r", function(d) {             
              return d.r;
            });*/

            this.svg.selectAll("circle").style({
                "fill": function(d) {
                    if (d.type == 'messageflow') {
                        if (!d.isRunning)
                            return "#ffd6d6";
                        return 'white';
                    } else if (d.type == 'applicationflow') {
                        if (!d.isRunning)
                            return "#ff9307";
                        return 'yellow';
                    } else {
                        return self.color(d.depth);
                    }
                    //return ((d.type != 'messageflow') || (d.type != 'applicationflow')) ? color(d.depth) : 'white' : 'yellow';
                },
                "display": "inline-block"
            })
            .on("click", function(d) {
                // check the type of the clicked element and call the getResources() method inside the chart controller
                //TODO emit events from this widget and handle them in the containing app's controller
                if (d.type == "inode") {
                  emit("nodeSelected",{
                                    id:d.id,
                                    type:d.type,
                                    name:d.name});
                    chartCtrl.getResources(d.id, null, null, null, d.type, d.name);
                } else if (d.type == "iserver") {
                    chartCtrl.getResources(d.parent.id, d.name, null, null, d.type, d.name);
                } else if (d.type == "messageflow") {
                    chartCtrl.getResources(d.parent.parent.id, d.parent.name, null, d.name, d.type, d.name);
                } else  if (d.type == "application") {
                    chartCtrl.getResources(d.parent.parent.id, d.parent.name, d.name, null, d.type, d.name);
                } else if (d.type == "applicationflow") {
                    chartCtrl.getResources(d.parent.parent.parent.id, d.parent.parent.name, d.parent.name, d.name, d.type, d.name);
                }
                if (self.focus !== d) zoom(d), d3.event.stopPropagation();
            });
            
            var text = this.svg.selectAll("text")
                .data(nodes)
                .enter().append("text")
                .attr("class", "label")
                .style("fill-opacity", function(d) {
                    return d.parent === root ? 1 : 0;
                })
                .style("display", function(d) {
                    return d.parent === root ? null : "none";
                })
                //.style("display", function(d) { if (d.attr('class')) })
                .text(function(d) {
                    return d.name;
                });
                
            var node = this.svg.selectAll("circle,text");

            this.svg 
                .style("background", self.color(-1))
                .on("click", function() {
                    zoom(root);
                });

            zoomTo([this.focus.x, this.focus.y, this.focus.r * 2 ]);
            
            function zoom(d) {
                var focus0 = this.focus;
                self.focus = d;
               
                var transition = d3.transition()
                    .duration(d3.event.altKey ? 7500 : 750)
                    .tween("zoom", function(d) {
                        var i = d3.interpolateZoom(view, [self.focus.x, self.focus.y, self.focus.r * 2]);
                        return function(t) {
                            zoomTo(i(t));
                        };
                    });

                transition.selectAll("text")
                    .filter(function(d) {
                        return d.parent === self.focus || this.style.display === "inline";
                    })
                    .style("fill-opacity", function(d) {
                        return d.parent === self.focus ? 1 : 0;
                    })
                    .each("start", function(d) {
                        if (d.parent === self.focus) this.style.display = "inline";
                    })
                    .each("end", function(d) {
                        if (d.parent !== self.focus) this.style.display = "none";
                    });
            }
            
            function zoomTo(v) {
                var k = canvas.width / v[2];
                view = v;
                node.attr("transform", function(d) {
                    return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")";
                });
                node.attr("r", function(d) {
                    return d.r * k;
                });
                node.attr("z-index", "-1");
            }            
      }
    }     
  };
  var circleChartWidget = {
    widget     : CircleChart,//widget constructor
    descriptor : {
      id          : "iib-circle-chart",
      name        : "Heat map",
      description : "Integration bus, nodes, servers, applications etc laid out as a circle pack",
      preview     : "images/circlePack.png",
      attributes  : [ ]
    }
  };
  
  function iibCircleChartDirective($rootScope,d3Util,iibWidgetRegistry){
    return {
      restrict: 'A',
      scope:{        
          "iibOnNodeClick":'&'
      },
      link: link
    };

    function link(scope,iElement,iAttrs){
      var widget=iibWidgetRegistry.createWidget("iib-circle-chart",scope);
      
      d3Util.renderWidget(widget,iElement);      
    }    
  }
  
  angular.module('iibWidgets')
  .config(function(iibWidgetRegistryProvider){
    iibWidgetRegistryProvider.register(circleChartWidget);
    
  })
  .directive('iibCircleChart', ['$rootScope', 'd3Util','iibWidgetRegistry',iibCircleChartDirective])
  ;
})();

