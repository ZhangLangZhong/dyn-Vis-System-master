/**
 *
 */
function d3layout(data, width, height) {
    var tmp_nodes = [];
    var index_of_nodes = [];
    var nodeNumber = 0;
    var links = [];
    var nodes = [];
    var nodeDict = {}
    this.draw = function () {
        data.forEach(function (item) {
            tmp_nodes.push(item.source);
            tmp_nodes.push(item.target);

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


        tmp_nodes = this.unique(tmp_nodes);
        index_of_nodes = d3.map();
        nodeNumber = tmp_nodes.length;
        //根据新增节点与已存在的节点的连接的度的大小顺序（升序）
        tmp_nodes.sort(function compare(a, b) {
            return a - b
        });
        for (var i = 0; i !== tmp_nodes.length; ++i) {
            var node = {id: tmp_nodes[i]};
            nodes.push(node);

            index_of_nodes.set(tmp_nodes[i], i);
        }

        data.forEach(function (item) {
            var link = {
                source: index_of_nodes.get(item.source),
                target: index_of_nodes.get(item.target)
            };
            links.push(link);
        });


        var svg = d3.select("#main")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        this.force = d3.layout.force()
            .nodes(nodes)
            .links(links)
            //     .linkDistance(50)
            .size([width, height])


        this.force.start();


        var svg_links = svg.selectAll(".link")
            .data(links)
            .enter()
            .append("line")
            .attr("class", "link")
            .attr("stroke-opacity", 0.9)
            .attr("stroke", "gray")


        var svg_nodes = svg.selectAll(".node")
            .data(nodes)
            .enter()
            .append("circle")
            .attr("class", "node")
            .attr("r", function (d) {
                return 5;
            })
            .attr("id", function (d) {
                return d.id;
            })
            .attr("opacity", 1)
            .attr("stroke", "red")
            .attr("fill", "red")
        //.call(mainChart.force.drag);

        this.force.on("tick", function () {
            svg_links.attr("x1", function (d) {
                return d.source.x;
            });
            svg_links.attr("y1", function (d) {
                return d.source.y;
            });
            svg_links.attr("x2", function (d) {
                return d.target.x;
            });
            svg_links.attr("y2", function (d) {
                return d.target.y;
            });

            svg_nodes.attr("cx", function (d) {
                return d.x;
            });
            svg_nodes.attr("cy", function (d) {
                return d.y;
            });
        });
        var count = 0;


    }
    this.unique = function (arr) {
        var result = [],
            hash = {};
        for (var i = 0, elem;
             (elem = arr[i]) != null; i++) {
            if (!hash[elem]) {
                result.push(elem);
                hash[elem] = true;
            }
        }
        return result;

    }

}


