import { load }  from './awareness_subgraph.js'

/* Load the dataset and formatting variables
  Ref: https://www.d3indepth.com/requests/ */

d3.csv("../data/mh_data_1.csv", d => { 
  return {
    mentalHealthProblem: +d.anymhprob,
    haveTakenMeds: +d.meds_any,
    txAny: +d.tx_any,
    haveInformalHelp: +d.inf_any,
    haveTherapy: +d.ther_any,
    awareness: +d.percneed,
    expression: +d.know_sp,
    availability: +d.knowwher,
    willingness: +d.dep_secret
  }
}).then(data => {

  /* Data Manipulation in D3
    Ref: https://observablehq.com/@d3/d3-extent?collection=@d3/d3-array */
  
  console.log('Data before formatting',data)

  data = data.map(d => {
    return {
      mentalHealthProblem: d.mentalHealthProblem == 1,
      sought_help: (d.haveTakenMeds + d.txAny + d.haveInformalHelp + d.haveTherapy)>0 ,
      awareness: d.awareness < 4,
      expression: d.expression < 3,
      availability: d.availability < 4,
      willingness: d.willingness > 2      
    }
  })

  console.log('Data after formatting', data)

  stageButtons();
  createMainFlowChart(data);

  
  // All data are categorical.
  
})

const stageButtons = () => {

  const stages = {
    'awareness': {
      'description': `<h2 style="font-size:500">AWARENESS:</h2>
      It is the ability to recognize symptoms(like behavioral issues with peers), and that you have a problem that may require intervention
      from someone else. <br><br>
      This is assessed by whether they identified their emotions (like sad, blue, anxious) and realised that they should seek help from someone.<br><br>
      Only 1% of individuals exhibit a deviation from this typical behavior, either struggling to recognize symptoms or acknowledging the need for help, or both.
    `,
      'color': '#ff00b4'
    },
    'expression': {
      'description': 'Hello I am expression',
      'color': '#00ffbc'
    },
    'availability': {
      'description': 'Hello I am availability',
      'color': '#8ea5ff'
    },
    'willingness': {
      'description': 'Hello I am willingness',
      'color': '#c493ff'
    },
  }

  d3.selectAll(".button_click").on("mouseover", function () {
    
    let buttonID = d3.select(this).attr("id");
    d3.selectAll('.stage-desc')
      .attr("stroke",stages[buttonID].color )
      
    d3.select('#stage-desc-1')
      .html(`<div style="color:${stages[buttonID].color};  font-size:800px; font-weight: 700;">${stages[buttonID].description}</div>`)
    
      d3.selectAll('.stage-desc')
      .transition()
      .duration(1000)
      .attr('opacity', 1)
    
    d3.select(`#stage-${buttonID}`)
      .transition()
      .duration(1000)
      .style("font-size", "1000px")
    
    d3.selectAll(`.point-${buttonID}_fallout`)
      .transition()
      .duration(1000)
    .attr('r',500)

  })

  d3.selectAll(".button_click").on("mouseleave", function () {

    let buttonID = d3.select(this).attr("id");
    d3.select(`#stage-${buttonID}`)
      .transition()
      .duration(1000)
      .style("font-size", "800px")
    
    d3.selectAll('.stage-desc')
    .transition()
    .duration(100)
      .attr('opacity', 0)
    
    d3.selectAll(`.point-${buttonID}_fallout`)
      .transition()
      .duration(1000)
    .attr('r',200)
  })
    


}

const createMainFlowChart = (data) => {

  /* Set the dimensions and margins of the graph
    Ref: https://observablehq.com/@d3/margin-convention */
  
  const width = 80000, height = 42000;
  
  data = dataProcessingForMainFlowChart(data, width, height)

  // Create a SVG container.
  d3.select('#bar').attr('style', `margin-top: 30px; margin-bottom: 10px; max-width: 88%`)

  const svg = d3.select('#bar').append('svg')
    .attr('viewBox', [0, 0, width, height ])
    .attr("style", "max-width: 100%; max-height: 100%; font: 10px sans-serif; background-color:#ffffff; outline: thin solid #E0E0E0; ")
    .attr("preserveAspectRatio", "xMinYMin meet")
  
  const defs = svg.append("svg:defs")
  let gradient = defs
    .append("svg:linearGradient")
    .attr("id", "gradient")
    .attr("x1", "50%")
    .attr("y1", "0%")
    .attr("x2", "50%")
    .attr("y2", "100%")
    .attr("spreadMethod", "pad");

  // Define the gradient colors
  gradient.append("svg:stop")
      .attr("offset", "0%")
      .attr("stop-color", "white")

  gradient.append("svg:stop")
      .attr("offset", "100%")
    .attr("stop-color", "#001eff")
  
  // Create tootip
  let tooltip = d3.select("#bar")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "10px")
    .style('font-size','15px')
    .style('text-align','center')

  let mouseover = function (d) {
      tooltip
        .style("opacity", 1)
    }
  let mousemove = function (i, d) {
      tooltip
        .html(`${d.text}<br>${d.percentage}%`)
        .style("left", (i.pageX+10) + "px")
        .style("top", (i.pageY + 10) + "px")
    }
    
    let mouseleave = function(d) {
      tooltip
        .style("opacity", 0)
    }
  
  // Constructs and configures a Sankey generator.
  const sankey = d3.sankey()
    .nodeId(d => d.name)
    .nodeWidth(100)
    .nodePadding(500);

  // Applies it to the data. We make a copy of the nodes and links objects
  // so as to avoid mutating the original.
  const {nodes, links} = sankey({
    nodes: data.nodes.map(d => Object.assign({}, d)),
    links: data.links.map(d => Object.assign({}, d))
  });

  let legend = ['positive_behavior', 'negative_behavior','sought help', 'did not seek help']
  let colorScale = d3.scaleOrdinal()
  .domain(legend)
    .range(['#262626', '#262626',  '#ffac00', '#000000']);
  
  let brainColorScale = d3.scaleOrdinal()
  .domain(legend)
    .range(['#3d144c']);
  
  // The stage description box
  let stage_desc = svg.append('g')
    
  stage_desc.append('rect')
    .attr('class', 'stage-desc')
    .attr('opacity',0)
    .attr('x', 1000)
    .attr('y', 1000)
    .attr('width', 30000)
    .attr('height', 15000)
    .attr("stroke", "black")
    .attr("stroke-width", "100px")
    .attr("rx", 600)
    .attr("ry", 600)
    .attr('fill', '#ffffff');
  
  stage_desc.append('foreignObject')
    .attr("opacity", 1)
    .attr('class', 'stage-desc')
    .attr('id', 'stage-desc-1')
    .attr('width', 27000)
    .attr('height', 12500)
    .style("background-color", "white")
    .style("padding", "10px")
    .attr("text-anchor", "left")
    .style("alignment-baseline", "middle")
    .style('text-align', 'left')
    .attr('x', 2500)
    .attr('y', 1100)
  
  // Creates the transparent circles that represent the nodes.
  const circle_node = svg.append('g')
    .selectAll('.node')
    .data(nodes)
    .enter()
    .append("g")
    .attr("class", "node")
    .attr("transform", d => `translate(${d.x}, ${d.y})`)
      
  circle_node.append("circle")
  .attr("r", 1)
    .attr("fill", d => colorScale(d.name))
  
  let text_placements = {
    'mentalHealthProblem': [0, 4000, 600 ],
    'awareness': [35, 8000,-3000], '~aware and ~sought help': [0, -1500,-1500],
    'expression': [-75, 9000, 6500], '~expressive and ~sought help': [0, -900,-1000],
    'availability': [55, 11000, -3500], '~available and ~sought help': [0, -1500,-1000],
    'willingness': [-57, 2000, 7200], '~willing and ~sought help': [0, -7500,27000],
    'help': [0, 0,0], 'sought_help':[0, -4200,4000], 'not_sought_help': [0, 19500,-8000]
  }

  // Adds a title on the nodes.
  circle_node
    .append("text")
    .attr('id',d=> `stage-${d.name}`)
    .text(d => `${d.text}`)
    .style("font-size", "800px")
    .style('font-weight', 700)
    .attr("dy", ".35em")
    .attr("text-anchor", "middle")
    .attr("transform", d => `rotate(${text_placements[d.name][0]}) translate(${text_placements[d.name][1]},${text_placements[d.name][2]})`)
    .attr('fill', d => {
     return d.color
    })
          .attr('text-shadow','1px 1px 2px red, 0 0 1em blue, 0 0 0.2em blue')
  
   
  // Creates the paths that represent the links.
  const link = svg.append("g")
    .attr("fill", "none")
    // .attr("stroke-opacity", 1)
    .selectAll()
    .data(links)
    .join("g")
  .style("mix-blend-mode", "normal");
  // .style("mix-blend-mode", "multiply");
 
  let y_multiplier = 70 // to add space between links to make them look like strands
  
  let curve = d3.link(d3.curveBumpX).source((d) => [d.source.x + (d.source.index_axis == 0 ? (d.start_index * y_multiplier): 0), d.source.y + (d.source.index_axis == 1 ? (d.start_index * y_multiplier): 0)])
    .target((d) => [d.target.x + (d.target.index_axis == 0 ? (d.end_index * y_multiplier): 0), d.target.y + (d.target.index_axis == 1 ? (d.end_index * y_multiplier): 0)])
    .x(d => d[0]).y(d => d[1]);
  
  link.append("path")
    .attr("d", d => getPath(d, curve, y_multiplier))
    .attr("stroke", (d) => {
      return brainColorScale(Math.round(d.start_index / 4))
    })
    .attr("stroke-width", 50)
    .attr('pointer-events', 'visibleStroke')
    .on("mouseover", (i, d) => mouseover(i))
    .on("mousemove", (i, d) => mousemove(i,d))
    .on("mouseleave", (i, d) => mouseleave(i))
   
  link.append('circle')
    .attr('class', d => {
      if (d.target.terminal_phase) {
        return `point-${d.name}`
      }
    })
    .attr('cx', d => {
      if (d.target.terminal_phase && d.path.includes('IntPointX')) {
        
        let sourceX = d.source.x + (d.source.index_axis == 0 ? (d.start_index * y_multiplier) : 0)
        let rho = 2 * Math.PI * ( d.intPoint.angle.start + (d.end_index * 15 * d.intPoint.angle.end - d.intPoint.angle.start)/360)/360
        let targetX = Math.cos(rho) * (d.target.y + d.intPoint.random - d.source.y )
        return sourceX + targetX + (d.target.end ? 5000 : 0)
        
      } else {
        return d.target.x - (d.target.terminal_phase & d.category == 'positive behavior' ? Math.floor(Math.random() * 300) : d.target.terminal_phase ? Math.floor(Math.random() * 100) : 0)
      }
    })
    .attr('cy', d => {
      if (d.target.terminal_phase && d.path.includes('IntPointX')) {
        let sourceY = d.source.y + (d.source.index_axis == 1 ? (d.start_index * y_multiplier) : 0)
        let rho = 2 * Math.PI * (d.intPoint.angle.start + (d.end_index * 15 * d.intPoint.angle.end - d.intPoint.angle.start) / 360) / 360
        let targetY = d.target.end? Math.sin(rho) * (d.target.y + d.intPoint.random - d.source.y ) : (d.intPoint.targetAbove? -1:1 ) * Math.abs(Math.sin(rho) * (d.target.y + d.intPoint.random - d.source.y ))
        return sourceY + targetY
      } else {
        return d.target.y + (d.end_index * y_multiplier)
      }
    })
    .attr('r', d => d.target.terminal_phase ? 200: 0)
    .attr("stroke", "black")
    .attr('stroke-width', 10)
    .attr("fill", d => colorScale(d.category == 'positive behavior'? 'sought help' : 'did not seek help') )
    
  
  let size = 500

  const legend_display = legend.slice(2, 4)

  // Create legend
  svg.append("g")
    .selectAll()
  .data(legend_display)
  .join("circle")
    .attr("cx", width - 10000)
    .attr("cy", function(d,i){ return height - (1000 + (2 - i)*(size+1000)) }) 
    .attr("r", size)
    .style("fill", function (d) { return colorScale(d) })
  

// Add one dot in the legend for each name.
  svg.append("g")
  .selectAll()
  .data(legend_display)
  .join("text")
    .attr("x", width - 8500)
    .attr("y", (d,i)=>{ return height - (1000 + (2 - i)*(size+1000)) }) 
    .style("fill", d=>{ return colorScale(d)})
    .text(d=>{ return `${d}`})
    .attr("text-anchor", "left")
    .style("alignment-baseline", "middle")
    .style("font-size", "800px")
    .style('font-weight', 700);
  
  //   const subgraph_data = [{
  //     category: 'awareness', graph: 'Graph1', x: 23000, y: 17500, html: '../html/awareness_graph.html', caption: 'Perceived Illness',
  //     path: 'M 23000 17500 c -3612 1392 1304 6812 -2400 5500'
  //   },
  //     {
  //       category: 'awareness', graph: 'Graph2', x: 25000, y: 21000,
  //       path: 'M 25000 21000 c -3612 1392 1304 6812 -1400 5500'
  //     },
  //     {
  //       category: 'awareness', graph: 'Graph3', x: 27000, y: 24500,
  //       path: 'M 27000 24500 c 134 995 -1680 204 -1000 3000'
  //     },
  //     { category: 'willingness', graph: 'Graph4', x: 66500, y: 25500, html: '../html/awareness_graph.html',
  //       path: 'M 66500 25500 c -1440 -3660 -2896 1389 -4899 -2428'
  //     },
  //     {
  //       category: 'willingness', graph: 'Graph5', x: 65000, y: 22000,
  //       path: 'M 65000 22000 l -2700 -1628'
  //     },
  //     {
  //       category: 'willingness', graph: 'Graph6', x: 68000, y: 20500,
  //       path: 'M 68000 20500 c -4367 2311 1070 -4096 -4900 -2628' 
  //     }
  //   ]
       
  //   const subgraphs_parent = svg.append('g')
  //     .selectAll('.subgraphs')
  //     .data(subgraph_data)
  //     .enter()
    
  //   // subgraphs_parent.append('g').attr('fill','none')
  //   //   .append("path")
  //   //   .attr('d', d => d.path)
  //   //   .attr('stroke','black')
  //   //   .attr("stroke-width", 200);
  
  //   const subgraphs = subgraphs_parent.append("circle")
  //     .attr("r", 800)
  //     .attr("class", "subgraphs")
  //     .attr('id', d=> d.graph)
  //     .attr("cx", d => d.x)
  //     .attr("cy", d => d.y)
  //     .attr('fill', 'url(#gradient)')
  //     .attr("filter", "url(#dropShadow)")
  
  //   let subgraph_svg = subgraphs.append('g').append('svg')
  //     .attr('viewBox', [0, 0, 3000, 3000])
  
  // subgraph_svg.append('div')
  // .attr('id', 'model')
  // .attr("style", "max-width: 100%; max-height: 100%; font: 10px sans-serif; background-color:rgba(247, 247, 247, 0.959); outline: thin solid #E0E0E0; ")
  // .attr("preserveAspectRatio", "xMinYMin meet")
  // .html(d=>d.html);
    // subgraphs_parent.append("svg:image")
    //   .attr("transform", function(d) {
    //     return "translate(" + d.x + "," + d.y + ")";
    //   })
    //   .attr("xlink:href", "/images/sunburst.png")
      // .attr("width", image_width)
      // .attr("height", image_height);
  
  //   subgraphs_parent.append('text')
  //     .attr('id', d=> `text_${d.graph}`)
  //   .text(d => d.caption? `${d.caption}`:'')
  //     .attr("x", d=>(d.x))
  //     .attr("y", d=>d.y)
  //     .attr("text-anchor", "middle")
  //   .style('fill',text_colour)
  
  //   subgraphs.on("click", (d,i) => {
  
  //     d3.select(`#${i.graph}`).attr('r', 5000)
      
  //     console.log("Subgraph ", i.graph);
  //     const overlay = d3.select('.overlay').style('display', 'flex')
  
  //     overlay.select('.close-btn') ? overlay.select('.close-btn').remove() : null
  //     overlay.append('span')
  //     .attr('class','close-btn')
  //       .text('x')
  //       .style("font-size", "45px")
  //       .style('font-weight', 900)
  //       .style('color','white')
  //       .on('click', closeModal);
      
  //     overlay.select('#model') ? overlay.select('#model').remove() : null
  
  //     d3.text(i.html).then((data) => {
        
  //       overlay.append('div')
  //         .attr('viewBox', [0, 0, width, height])
  //         .attr('id', 'model')
  //         .attr("style", "max-width: 100%; max-height: 100%; font: 10px sans-serif; background-color:rgba(247, 247, 247, 0.959); outline: thin solid #E0E0E0; ")
  //         .attr("preserveAspectRatio", "xMinYMin meet")
  //         .html(data);
        
  //       load();
  
  //     })
      
  // })
  //   // subgraphs.on('click',  handleMouseOver)
  //     .on("mouseover", (d, i) => { return (handleMouseOver(i)) })
  //     .on("mouseout", (d, i) => { return (handleMouseOut(i)) });
  
  
  return svg.node();

}

function getPath( d, curve, y_multiplier){
  if (d.target.terminal_phase == true) {

    let sourceX = d.source.x + (d.source.index_axis == 0 ? (d.start_index * y_multiplier) : 0)
    let sourceY = d.source.y + (d.source.index_axis == 1 ? (d.start_index * y_multiplier) : 0)
    let path = d.path.replace('SourceX', sourceX ).replace('SourceY', sourceY )
    
    if (d.path.includes('IntPointX')) {

      let rho = 2 * Math.PI * ( d.intPoint.angle.start + (d.end_index * 15 * d.intPoint.angle.end - d.intPoint.angle.start)/360)/360
      let targetX = Math.cos(rho) * (d.target.y + d.intPoint.random - d.source.y )
      let targetY = d.target.end? Math.sin(rho) * (d.target.y + d.intPoint.random - d.source.y ) : (d.intPoint.targetAbove? -1:1 ) * Math.abs(Math.sin(rho) * (d.target.y + d.intPoint.random - d.source.y ))

      path = path.replace('IntPointX', d.intPoint.x ).replace('IntPointY', d.intPoint.y)
      .replace('RelTargetX', targetX).replace('RelTargetY',targetY )
      
    } else {

        path = path.replace('RelTargetX', (d.target.x - (d.source.x + (d.source.index_axis == 0 ? (d.start_index * y_multiplier) : 0))))
        .replace('RelTargetY', (d.target.y - (d.source.y + (d.source.index_axis == 1 ? (d.start_index * y_multiplier) : 0))))
    }
    return path
  } else {
    return curve(d)
  }
}

function closeModal() {
  d3.select('.overlay').style('display', 'none');
}

// Function to handle mouseover event
function handleMouseOver(d) {

  d3.select(`#${d.graph}`).transition()
        .duration(200)
      .attr("r", 5000) // Increase the radius on hover
    
  d3.select(`#text_${d.graph}`)
    .transition()
    .duration(200)
    .style("font-size", "800px")
    .style('font-weight', 700)
  

}

// Function to handle mouseout event
function handleMouseOut(d) {
    d3.select(`#${d.graph}`).transition()
        .duration(200)
    .attr("r", 800); // Restore the original radius on mouseout
  
  d3.select(`#text_${d.graph}`)
    .transition()
    .duration(200)
    .style("font-size", "0")
    .style('font-weight', 0)
  
}

const scalerFunc = (data, normalizer) => {
  return Math.round(data.length/normalizer)
}

const dataProcessingForMainFlowChart = (data, width, height) => {

  const margins = { top: height / 21,  bottom: height / 21, left: width/40, right: width/40};

  // This function scales and transforms the data according to the required format for the graph
  // Nodes -> Each phase of menatal health help seeking behavior (Not shown in the graph as nodes, but created for the purpose of creating links
  // and displaying details related to phases)
  // Link -> Transition from one stage to another

  let nomalizer = data.length / 100  //Used to generate percentages (graph shows a summary)

  let passed_awareness = data.filter(d => (!(!(d.awareness) & !(d.expression) & !(d.availability) & !(d.willingness) & !(d.sought_help))))
  let passed_expression = passed_awareness.filter(d => (!(!(d.expression) & !(d.availability) & !(d.willingness) & !(d.sought_help))))
  let passed_availability = passed_expression.filter(d => (!(!(d.availability) & !(d.willingness) & !(d.sought_help))))
  let passed_willingness = passed_availability.filter(d => (!(!(d.willingness) & !(d.sought_help))))

  let nodes = [
  
    // {name: NodeID,
    //text: To be displayed on the flow,
    //subtext : To be displayed when hovered over
    // x: x position of the node, y: position of the node, 
    //terminal_phase: Used to identify whether the node is a terminal phase or an intermediate phase , 
    //index_axis: Axis to distribute the links at connection nodes - 1 indicates along the y axis and 0 indicates along the x axis },
  
    { name: 'mentalHealthProblem', text: 'HAVE \nMENTAL \nILLNESS', subtext: '', x: margins.left, y: height - margins.bottom, terminal_phase: false, end: false, index_axis: 0, path: '' },
    {
      name: 'awareness', text: `AWARENESS OF ILLNESS`, subtext: `${scalerFunc(passed_awareness,nomalizer)}%`,
      x: (2 * width / 12), y: (8 * height) / 14, terminal_phase: false, index_axis: 1,
      path: 'M 5712 -1782 c 3147 260 3000 5900 9000 5500', color : '#ff00b4'
    }, 
    {
      name: '~aware and ~sought help',
      text: `${scalerFunc(data.filter(d => (!(d.awareness) & !(d.expression) & !(d.availability) & !(d.willingness) & !(d.sought_help))), nomalizer)}%`,
      subtext:'',
      x: ( 2 * width / 18), y: (7 * height) / 14 , terminal_phase: true, end: false, index_axis: 1 , path: ''
    },
    {
      name: 'expression', text: `ABILITY TO EXPRESS`, subtext: `${scalerFunc(passed_expression,nomalizer)}%`,
      x: (4 * width) / 12, y: height * 5 / 7, terminal_phase: false, end: false, index_axis: 1,
      path:'', color : '#00ffbc'
        // 'M 8485 -1657 c 3347 -1694 -21 -6838 3387 -8056'
    },
    {
      name: '~expressive and ~sought help',
      text: `${scalerFunc(passed_awareness.filter(d => (!(d.expression) & !(d.availability) & !(d.willingness) & !(d.sought_help))), nomalizer) + 1}%`,
      subtext:'',
      x: ( 5* width) / 17 , y: (17 * height)/18, terminal_phase: true, end: false, index_axis: 1, path: ''
    },
    {
      name: 'availability', text: `AVAILABILITY OF HELP`, subtext: `${scalerFunc(passed_availability ,nomalizer)}%`,
      x: (6 * width) / 12, y: height / 7, terminal_phase: false, end: false, index_axis: 1,
      path:'', color : '#8ea5ff'
        // 'M 8065 1831 c 4151 91 1545 6607 6243 6485'
    },
    {
      name: '~available and ~sought help', text: `${scalerFunc(passed_expression.filter(d => (!(d.availability) & !(d.willingness) & !(d.sought_help))), nomalizer)}%`,
      subtext:'',
      x: (8 * width / 18), y: (2 * height) / 16, terminal_phase: true, end: false, index_axis: 1, path: ''
    },
    {
      name: 'willingness', text: `WILLINGNESS TO SHARE`, subtext: `${scalerFunc( passed_willingness, nomalizer)}%`,
      x: (8 * width) / 12, y: (3 * height) / 7, terminal_phase: false, end: false, index_axis: 1,
      path: 'M 6423 5955 c 4176 -126 1107 -6619 5501 -7734' , color : '#c493ff'
    },
    {
      name: '~willing and ~sought help', text: `${scalerFunc(passed_availability.filter(d => (!(d.willingness) & !(d.sought_help))), nomalizer)}%`,
      subtext:'',
      x: (8 * width / 12), y: (height) / 6, terminal_phase: true, end: false, index_axis: 1, path: ''
    },
    { name: 'help', text: '',subtext:'', x: (10 * width)/12, y: (7* height/42) , terminal_phase: false , end: false, index_axis : 1, path: ''},
    {
      name: 'sought_help', text: ``, subtext: `${scalerFunc(passed_willingness.filter(d => d.sought_help), nomalizer)}%`,
      x: width - margins.right, y: (3* height)/9 , terminal_phase: true, end: true, index_axis: 1, path: ''
    },
    {
      name: 'not_sought_help', text: `${scalerFunc(passed_willingness.filter(d => ((!(d.sought_help)))), nomalizer)}%`,
      subtext:'',
      x: (6 * width / 12), y: (2 * height)/ 7, terminal_phase: true, end: false, index_axis: 1, path: ''
    },
  ]

  let links = [
    // Initialization of link types
    // {
    //   source: The source node
    //   target: The target node
    //   value: scaled number of people transitioning from one phase to the next
    //   category: Whether the link represents a positive behavior or a negative behaviour at this stage
    //   text: Text to  be displayed when hovered over the link
    // }
    
    [{
      source: 'mentalHealthProblem', target: 'awareness',
      value: scalerFunc(data, nomalizer),
      text: "", dif_end: false
    }], 
      // From Awareness to Expression
    [{  name: 'awareness_fallout',
        source: 'awareness', target: '~aware and ~sought help',
        value: scalerFunc(data.filter(d => (!(d.awareness) & !(d.expression) & !(d.availability) & !(d.willingness) & !(d.sought_help))), nomalizer),
        path: 'MSourceX,SourceYc5000,-1000,-1000,-5000,RelTargetX,RelTargetY',
        text: "Does not seek help as\n they think they don't need help", dif_end: true
    },
    {
      source: 'awareness', target: 'expression',
      value: scalerFunc(data.filter(d => ((d.awareness) || (!(d.awareness) & !(!(d.expression) & !(d.availability) & !(d.willingness) & !(d.sought_help))))),nomalizer),
      text: "They know they need help", dif_end: false
    },
    // {
    //   source: 'awareness', target: 'expression',
    //   value: scalerFunc(data.filter(d => (!(d.awareness) & !(!(d.expression) & !(d.availability) & !(d.willingness) & !(d.sought_help)))), nomalizer),
    //   category: 'negative behavior', text: "Thinks they don't need help", dif_end: false
    //   }
    ], // didn't complete any of the stages in help seeking behavior
      // From Expression to Availability
    [{
      source: 'expression', target: 'availability',
      value: scalerFunc(passed_awareness.filter(d => ((d.expression) || (!(d.expression) & !(!(d.availability) & !(d.willingness) & !(d.sought_help))))),nomalizer),
      text: "Able to explain what they feel", dif_end: false
    },
    // {
    //   source: 'expression', target: 'availability',
    //   value: scalerFunc(passed_awareness.filter(d => (!(d.expression) & !(!(d.availability) & !(d.willingness) & !(d.sought_help)))), nomalizer),
    //   text: "Unable to explain what they feel", dif_end: false
    // },
    { name: 'expression_fallout',
      source: 'expression', target: '~expressive and ~sought help',
      value: scalerFunc(passed_awareness.filter(d => (!(d.expression) & !(d.availability) & !(d.willingness) & !(d.sought_help))), nomalizer),
      path:'MSourceX,SourceYq10000,1000,RelTargetX,RelTargetY',
      text: "Does not seek help as\n they are unable to explain", dif_end: true
    }],
      // From Availability to Willingness
    [{name: 'availability_fallout',
      source: 'availability', target: '~available and ~sought help',
      value: scalerFunc(passed_expression.filter(d => (!(d.availability) & !(d.willingness) & !(d.sought_help))), nomalizer),
      path: 'MSourceX,SourceYc5000,0,-2000,-5000,RelTargetX,RelTargetY',
      text: "Does not seek help as they don't know where to find help", dif_end: true
    },
    {
      source: 'availability', target: 'willingness',
      value: scalerFunc(passed_expression.filter(d => ((d.availability) || (!(d.availability) & !(!(d.willingness) & !(d.sought_help))))), nomalizer),
      text: "Knows where to find help", dif_end: false
    },
    // {
    //   source: 'availability', target: 'willingness',
    //   value: scalerFunc(passed_expression.filter(d => (!(d.availability) & !(!(d.willingness) & !(d.sought_help)))),nomalizer),
    //   text: "Doesn't know where to find help", dif_end: false
    //   }
    ],
      // From Willingness to Help
    [
    {
      source: 'willingness', target: 'help',
      value: scalerFunc(passed_availability.filter(d => ((d.willingness) || ((!(d.willingness)) & (d.sought_help)))),nomalizer),
      category: 'positive behavior', text: "Willing to seek help", dif_end: false
    },
    // {
    //   source: 'willingness', target: 'help',
    //   value: scalerFunc(passed_availability.filter(d => ((!(d.willingness)) & (d.sought_help))),nomalizer),
    //   category: 'negative behavior' , text: "Unwilling to seek help", dif_end: false
    // },
    { name: 'willingness_fallout',
      source: 'willingness', target: '~willing and ~sought help',
      intPoint: {
        x: 5000,
        y: -1000,
        angle: {
          start: 45,
          end: 90
        }
      },
      value: scalerFunc(passed_availability.filter(d => (!(d.willingness) & !(d.sought_help))),nomalizer),
      path: 'MSourceX,SourceYqIntPointX,IntPointY,RelTargetX,RelTargetY',
        // 'MSourceX,SourceYq8314,-1584,RelTargetX,RelTargetY',
      category: 'negative behavior', text: "Does not seek help as\n as they are unwilling to seek help", dif_end: true
    }],
    // Sought Help or Not
    [{
      source: 'help', target: 'not_sought_help',
      value: scalerFunc(passed_willingness.filter(d => (!(d.sought_help))), nomalizer),
      intPoint: {
        x: 5000,
        y: -1000,
        angle: {
          start: 180,
          end: 270
        },
        targetAbove: true
      },
      path: 'MSourceX,SourceYqIntPointX,IntPointY,RelTargetX,RelTargetY',
      category: 'negative behavior', text: "Does not seek help", dif_end: true
    },
    {
      source: 'help', target: 'sought_help',
      value: scalerFunc(passed_willingness.filter(d => ((d.sought_help))), nomalizer),
      intPoint: {
        x: 5000,
        y: -1000,
        angle: {
          start: -60,
          end: 45
        },
        targetAbove: false
        },
      path: 'MSourceX,SourceYl5000,0qIntPointX,IntPointY,RelTargetX,RelTargetY',
      category: 'positive behavior', text: "Sought for help in the end", dif_end: false 
    }]
  ]
  
  let new_links = []

  //the link popularizing algorithm : This multiplies the links by the number of values in each link type
  for (let i = 0; i < links.length; i++){
    let limit = 0
    for (let j = 0; j < links[i].length; j++) {

      const temp_link = links[i][j]
      let temp_links = Array(temp_link.value).fill({
        source: temp_link.source,
        target: temp_link.target,
        value: 1,
        category: temp_link.category,
        text: temp_link.text,
        path: temp_link.path,
        dif_end: temp_link.dif_end,
        intPoint: temp_link.intPoint,
        name: temp_link.name
      })

      for (let index = limit; index < limit + temp_link.value; index++) {
        temp_links[index-limit] = {
          ...temp_links[index - limit],
          intPoint: {
            ...temp_links[index - limit].intPoint,
            random: Math.random()*800,
          },
          start_index: index,
          end_index: temp_link.dif_end ? index - limit: index,
          percentage: temp_link.value // percentage to be displayed when hovered over
        }
        
      }
      limit += temp_link.value
      new_links = new_links.concat(temp_links)
    }
  } 

  return {
    links: new_links,
    nodes
  }

}