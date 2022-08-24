/**
 *
 */
function IncrementalLayout() {
    var width = $("#main").width();
    var height = $("#main").height();
    var startData = null;
    var preData = null;
    var nowData = null;
    var layoutNodes = [];
    var nodesIdArray = [];
    var layout;
    var run = true;

    var a = d3.rgb(255,0,0);	//红色
    var b = d3.rgb(144,202,235);	//绿色
    var compute = d3.interpolate(a,b);
    var linear = d3.scale.linear()
        .domain([1,10])
        .range([0,1]);

    IncrementalLayout.prototype.init = function () {
        $.ajax({
            type: "get",
            dataType: "json",
            url: "/brush_extent",
            async: false,
            data: {
                "layout_type": now_layout_type,
                "start": FormatDateTime(new Date('2015-4-23 16:45')),
                "end": FormatDateTime(new Date('2015-4-23 16:50'))
            },
            contentType: "application/json",
            success: function (initData) {
                startData = transform(initData);
                preData = startData;
                layout = new d3layout(startData, width, height);
                layout.draw();
            },
            Error: function (error) {
                console.log(error);
            }
        });
    };

    IncrementalLayout.prototype.updateFromOthers = function (updateData) {
        layout.force.stop();
        //只执行最开始的一次
        if (run) {
            layoutNodes = countArray(startData);
            run = false;
        }
        nowData = transform(updateData);
        var nowDatanode = findNode(nowData);
        var preDatanode = findNode(preData);
        var deleteNodeId, addNode; // deleteNode 删除节点
        // deleteNodeId = difference(preDatanode, nowDatanode);
        var layoutSourTar = preData;
        addNode = difference(nowDatanode,preDatanode)
        preData = nowData;

      //  console.log('现在节点长度：' + Array.from(nowDatanode).length, '以前节点长度：'+ Array.from(preDatanode).length)

       //把当前的节点复制一份
        var perLayoutNodes = [];
        layoutNodes.forEach(function (d) {
            var dict = {
                'id': d.id,
                'age': d.age,
                'degree': d.degree,
                'links': [].concat(d.links),
                'x': d.x,
                'y': d.y,
                'subs': d.subs
            };
            perLayoutNodes.push(dict);
        });
        // console.log('以前的节点属性：');
        // console.log([].concat(perLayoutNodes));
        //前一时刻节点的节点数
        var perNodes = Array.from(preDatanode);
        nodesIdArray = [].concat(perNodes);

        var addNodes = [];
        var addEdges = [];
        //把前一时刻节点对象转化为字符串，方便比较其是否包含特定对象

        var layoutNodesStr = JSON.stringify(layoutSourTar);
        nowData.forEach(function (d, index) {
            var sourceId = d.source, targetId = d.target;
            //对象字符串
            var d_str = JSON.stringify(d);
            if(!layoutNodesStr.includes(d_str)){
                if(nodesIdArray.includes(sourceId) && nodesIdArray.includes(targetId)){
                    addEdges.push(d);
                }else{
                    addNodes.push(d);
                }
            }
        });

        layoutNodes = [].concat(deleteNodes(layoutNodes, nowData));//配置删除后的节点
        var aer = new AER(layoutNodes, addEdges, width, height);
        aer.start();//添加边时，位置变化
        var ssbm = new SSBM(layoutNodes, addNodes, width, height);
        ssbm.start();//初始化新增节点位置
        var age = new AGE(perLayoutNodes, layoutNodes, addNode);
        age.start();//设置年龄

        var repulsion = new RepulsionAll(layoutNodes, width, height);
        repulsion.start();//计算排斥力等，移动位置


      //   console.log('变化后的节点属性：')
      //   console.log([].concat(layoutNodes));
        drawing(layoutNodes, width, height); //重新绘制节点
    };

    function transform(initData) {
        var copylinks =  initData.links.map(function (item) {
            return {source: item.source, target: item.target}
        })

      return copylinks.filter(function (d) {
           return d.source != d.target;
        })
    }

    function findNode(data) {
        var nodeData = new Set()
        data.forEach(function (item) {
            nodeData.add(item.source)
            nodeData.add(item.target)
        })
        return nodeData
    }

    function difference(thisSet, otherSet) {
        //初始化一个新集合，用于表示差集。
        var differenceSet = new Set();
        //将当前集合转换为数组
        var values = Array.from(thisSet);
        //遍历数组，如果另外一个集合没有该元素，则differenceSet加入该元素。
        for (var i = 0; i < values.length; i++) {
            if (!otherSet.has(values[i])) {
                differenceSet.add(values[i]);
            }
        }
        return Array.from(differenceSet)
    };


    function countArray(data) {
        var nodeDict = {};
        var layoutNodes = [];
        data.forEach(function (item) {

            if (nodeDict[item.source]) {
                nodeDict[item.source].push(item.target)
            } else {
                nodeDict[item.source] = [];
                nodeDict[item.source].push(item.target)
            }

            if (nodeDict[item.target]) {
                nodeDict[item.target].push(item.source)
            } else {
                nodeDict[item.target] = [];
                nodeDict[item.target].push(item.source)
            }

        });
        var count = 0;

        d3.selectAll(".node").each(function (d) {
            var id = d3.select(this).attr('id');
            var x = d3.select(this).attr('cx');
            var y = d3.select(this).attr('cy');
            var dict = {};
            dict['id'] = id;
            dict['links'] = nodeDict[id];
            dict['subs'] = count;
            dict['age'] = 1;
            dict['degree'] = nodeDict[id].length;
            dict['x'] = Number(x);
            dict['y'] = Number(y);
            layoutNodes.push(dict)
            count++;
        })

        return layoutNodes;
    }

    function drawing(layoutNodes, width, height) {
        d3.select("#main").select("svg").remove();
        var id_index = idToIndex(layoutNodes);

        var svg = d3.select("#main")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        for (var i = 0; i < layoutNodes.length; i++) {
            svg.append("g")
                .attr("class", "links")
                .selectAll("line")
                .data(layoutNodes[i].links).enter()
                .append("line")
                .attr("class", "link")
                .attr("stroke-width", 0.5)
                .attr("x1", layoutNodes[i].x)
                .attr("y1", layoutNodes[i].y)
                .attr("x2", function (d) {
                    return layoutNodes[id_index[d] - 0].x;
                })
                .attr("y2", function (d) {
                    return layoutNodes[id_index[d] - 0].y;
                })
                .attr("stroke", "gray")
        }

        svg.append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(layoutNodes).enter()
            .append("circle")
            .attr("class", "node")
            .attr("r", 5)
            .attr("cx", function (d) {
                return d.x;
            })
            .attr("cy", function (d) {
                return d.y;
            })
            .attr("id", function (d) {
                return d.id;
            })
            .attr("fill", function (d) {
                return compute(linear(d.age))
            })
            .attr("stroke", "gray")
    }

    function idToIndex(layoutNodes) {
        var idIndex = {};
        layoutNodes.forEach(function (d) {
            idIndex[d.id] = d.subs;
        })
        return idIndex;
    }
}
