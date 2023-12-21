import { load }  from './awareness_subgraph.js'

/* Load the dataset and formatting variables
  Ref: https://www.d3indepth.com/requests/ */
d3.csv("../data/data.csv", d => { 
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
  createMainFlowChart(data);

  
  // All data are categorical.
  
})

const createMainFlowChart = (data) => {

  /* Set the dimensions and margins of the graph
    Ref: https://observablehq.com/@d3/margin-convention */
  
  const width = 80000, height = 42000;
  
  data = dataProcessingForMainFlowChart(data, width, height)

  // Create a SVG container.
  d3.select('#bar').attr('style', `margin-top: 30px; margin-bottom: 10px; max-width: 88%`)

  const svg = d3.select('#bar').append('svg')
    .attr('viewBox', [0, 0, width, height ])
    .attr("style", "max-width: 100%; max-height: 100%; font: 10px sans-serif; background-color:#dddddd59; outline: thin solid #E0E0E0; ")
    .attr("preserveAspectRatio", "xMinYMin meet")

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

  let legend = ['positive behavior', 'negative behavior', 'sought help', 'did not seek help']
  let colorScale = d3.scaleOrdinal()
  .domain(legend)
    .range(['#4C9900', '#7f7f7f', '#FF9933','#8C564B' ]);
  
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
    'mentalHealthProblem': [0, -600, 600 ],
    'awareness': [34, 3000,2000], '~aware and ~sought help': [0, -2000,-2800],
    'expression': [-70, 8000, 5000], '~expressive and ~sought help': [0, -900,-1000],
    'availability': [55, 7000, -4000], '~available and ~sought help': [0, 500,-7000],
    'willingness': [-55, 5000, 4500], '~willing and ~sought help': [0, 500,-5000],
    'help': [0, 0,0], 'sought_help':[0, -4200,4000], 'not_sought_help': [0, -1500,0]
  }

  // Adds a title on the nodes.
  circle_node.append("text")
    .text(d => `${d.subtext}`)
    .style("font-size", "800px")
    .style('font-weight', 700)
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .attr("transform", d => `rotate(${text_placements[d.name][0]}) translate(${text_placements[d.name][1] + 6000 },${text_placements[d.name][2]-1000})`)

  circle_node.append("text")
        .text(d => `${d.text}`)
        .style("font-size", "800px")
        .style('font-weight', 700)
          .attr("dy", ".35em")
          .attr("text-anchor", "start")
          .attr("transform", d => `rotate(${text_placements[d.name][0]}) translate(${text_placements[d.name][1]},${text_placements[d.name][2]})`)

  const subgraph_data = [{
    category: 'awareness', graph: 'Graph1', x: 20000, y: 24500, html: '../html/awareness_graph.html',
    image: 'https://cdn4.iconfinder.com/data/icons/seo-and-data/500/pencil-gear-128.png'
  },
    { category: 'awareness', graph: 'Graph2', x: 22000, y: 26000 },
    { category: 'awareness', graph: 'Graph3', x: 24000, y: 27500 },
    { category: 'willingness', graph: 'Graph4', x: 65000, y: 17000, html: '../html/awareness_graph.html' },
    { category: 'willingness', graph: 'Graph5', x: 66500, y: 14500 },
    { category: 'willingness', graph: 'Graph6', x: 68000, y: 12000 }
  ]
  
  
  const subgraphs = svg.append('g')
    .selectAll('.subgraphs')
    .data(subgraph_data)
    .enter()
    .append("circle")
    .attr("r", 800)
    .attr("class", "subgraphs")
    .attr('id', d=> d.graph)
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)

    subgraphs
    .append("clipPath")
    .attr("class", "clipSubgraph")
      .append('circle')
      .attr('id','innerCircle')
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr('r', 800)
    ;
  
  subgraphs.on("click", (d,i) => {

    d3.select(`#${i.graph}`).attr('r', 5000)
    
    console.log("Subgraph ", i.graph);
    const overlay = d3.select('.overlay').style('display', 'flex')

    overlay.select('.close-btn') ? overlay.select('.close-btn').remove() : null
    overlay.append('span')
    .attr('class','close-btn')
      .text('x')
      .style("font-size", "45px")
      .style('font-weight', 900)
      .style('color','white')
      .on('click', closeModal);
    
    overlay.select('#model') ? overlay.select('#model').remove() : null

    d3.text(i.html).then((data) => {
      
      overlay.append('div')
        .attr('viewBox', [0, 0, width, height])
        .attr('id', 'model')
        .attr("style", "max-width: 100%; max-height: 100%; font: 10px sans-serif; background-color:rgba(247, 247, 247, 0.959); outline: thin solid #E0E0E0; ")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .html(data);
      
      load();

    })
    
})
  // subgraphs.on('click',  handleMouseOver)
  .on("mouseover", handleMouseOver)
    .on("mouseout", handleMouseOut);


  // Creates the paths that represent the links.
  const link = svg.append("g")
    .attr("fill", "none")
    .attr("stroke-opacity", 0.5)
    .selectAll()
    .data(links)
    .join("g")
    .style("mix-blend-mode", "multiply");
 
  let y_multiplier = 70 // to add space between links to make them look like strands
  
  let curve = d3.link(d3.curveBumpX).source((d) => [d.source.x + (d.source.index_axis == 0 ? (d.start_index * y_multiplier): 0), d.source.y + (d.source.index_axis == 1 ? (d.start_index * y_multiplier): 0)])
    .target((d) => [d.target.x + (d.target.index_axis == 0 ? (d.end_index * y_multiplier): 0), d.target.y + (d.target.index_axis == 1 ? (d.end_index * y_multiplier): 0)])
    .x(d => d[0]).y(d => d[1]);
  
  link.append("path")
    .attr("d", d => curve(d))
    .attr("stroke", (d) => colorScale(d.category))
    .attr("stroke-width", 40);

  link.append("title")
    .text(d => `${d.text}\n${d.percentage}%`);
  
  link.append('circle')
    .attr('cx', d => d.target.x - (d.target.terminal_phase & d.category == 'positive behavior'? Math.floor(Math.random() * 300) : d.target.terminal_phase? Math.floor(Math.random() * 100):0 ))
    .attr('cy', d => d.target.y + (d.end_index * y_multiplier))
    .attr('r', d => d.target.terminal_phase ? 100: 0)
    .attr("stroke", "black")
    .attr('stroke-width', 10)
    .attr("fill", d => colorScale(d.category == 'positive behavior'? 'sought help' : 'did not seek help') )
    
  
  let size = 500

  // Create legend
  svg.append("g")
    .selectAll()
  .data(legend)
  .join("circle")
    .attr("cx", 1500)
    .attr("cy", function(d,i){ return 2000 + i*(size+1000)}) 
    .attr("r", size)
    // .attr("height", size)
    .style("fill", function (d) { return colorScale(d) })
  

// Add one dot in the legend for each name.
  svg.append("g")
  .selectAll()
  .data(legend)
  .join("text")
    .attr("x", 1500 + size*2)
    .attr("y", (d,i)=>{ return 2000 + i*(size+1000) }) 
    .style("fill", d=>{ return colorScale(d)})
    .text(d=>{ return `${d}`})
    .attr("text-anchor", "left")
    .style("alignment-baseline", "middle")
    .style("font-size", "800px")
    .style('font-weight', 700);
  
  return svg.node();

}

function closeModal() {
  d3.select('.overlay').style('display', 'none');
}

// Function to handle mouseover event
function handleMouseOver() {
    d3.select(this).transition()
        .duration(200)
        .attr("r", 5000); // Increase the radius on hover
  
  // d3.select(this)
  //   .select('#innerCircle')
  //   .append('image')
  //   .attr('id','img')
  //   // .attr('xlink:href', d => d.image)
  //   // .attr('width', 1000)
  //   // .attr('height', 1000)
}

// Function to handle mouseout event
function handleMouseOut() {
    d3.select(this).transition()
        .duration(200)
    .attr("r", 800); // Restore the original radius on mouseout
  
  // d3.select(this)
  //   .select('#img')
  // .remove()
  
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
  
    { name: 'mentalHealthProblem', text: 'HAVE \nMENTAL \nILLNESS', subtext:'', x: margins.left, y: height - margins.bottom, terminal_phase: false, index_axis : 0}, 
    {
      name: 'awareness', text: `AWARENESS OF ILLNESS`, subtext: `${scalerFunc(passed_awareness,nomalizer)}%`,
      x: (2 * width / 12), y: (8 * height) / 14, terminal_phase: false, index_axis: 1
    }, 
    {
      name: '~aware and ~sought help',
      text: `${scalerFunc(data.filter(d => (!(d.awareness) & !(d.expression) & !(d.availability) & !(d.willingness) & !(d.sought_help))), nomalizer)}%`,
      subtext:'',
      x: (3 * width / 12), y: (13 * height) / 14 , terminal_phase: true, index_axis: 1
    },

    {
      name: 'expression', text: `ABILITY TO EXPRESS`, subtext: `${scalerFunc(passed_expression,nomalizer)}%`,
      x: (4 * width) / 12, y: height * 5 / 7, terminal_phase: false, index_axis: 1
    },
    {
      name: '~expressive and ~sought help',
      text: `${scalerFunc(passed_awareness.filter(d => (!(d.expression) & !(d.availability) & !(d.willingness) & !(d.sought_help))), nomalizer) + 1}%`,
      subtext:'',
      x: (5 * width) / 12 , y: (13 * height)/14, terminal_phase: true, index_axis: 1
    },

    {
      name: 'availability', text: `AVAILABILITY OF HELP`, subtext: `${scalerFunc(passed_availability ,nomalizer)}%`,
      x: (6 * width) / 12, y: height / 7, terminal_phase: false, index_axis: 0
    },
    {
      name: '~available and ~sought help', text: `${scalerFunc(passed_expression.filter(d => (!(d.availability) & !(d.willingness) & !(d.sought_help))), nomalizer)}%`,
      subtext:'',
      x: (7 * width / 12), y: (5 * height) / 7, terminal_phase: true, index_axis: 1
    },

    {
      name: 'willingness', text: `WILLINGNESS TO SHARE`, subtext: `${scalerFunc( passed_willingness, nomalizer)}%`,
      x: (8 * width) / 12, y: (3 * height) / 7, terminal_phase: false, index_axis: 0
    },
    {
      name: '~willing and ~sought help', text: `${scalerFunc(passed_availability.filter(d => (!(d.willingness) & !(d.sought_help))), nomalizer)}%`,
      subtext:'',
      x: (9 * width / 12), y: (5 * height) / 7, terminal_phase: true, index_axis: 1
    },

    { name: 'help', text: '',subtext:'', x: (10 * width)/12, y: height/7 , terminal_phase: false , index_axis : 0},
    {
      name: 'sought_help', text: ``, subtext: `${scalerFunc(passed_willingness.filter(d => d.sought_help), nomalizer)}%`,
      x: width - margins.right, y: margins.top, terminal_phase: true, index_axis: 1
    },
    {
      name: 'not_sought_help', text: `${scalerFunc(passed_willingness.filter(d => ((!(d.sought_help)))), nomalizer)}%`,
      subtext:'',
      x: width-  margins.right, y: (3 * height)/ 7, terminal_phase: true, index_axis: 1
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
    
    {
      source: 'mentalHealthProblem', target: 'awareness',
      value: scalerFunc(data, nomalizer),
      category: 'positive behavior', text: ""
    },
    null, null,    // Note : In order to support the link popularizing algorithm
      // From Awareness to Expression
    {
      source: 'awareness', target: 'expression',
      value: scalerFunc(data.filter(d => ((d.awareness))),nomalizer),
      category: 'positive behavior', text: "They know they need help" 
    },
    {
      source: 'awareness', target: 'expression',
      value: scalerFunc(data.filter(d => (!(d.awareness) & !(!(d.expression) & !(d.availability) & !(d.willingness) & !(d.sought_help)))), nomalizer),
      category: 'negative behavior', text: "Thinks they don't need help"
    },
    {
      source: 'awareness', target: '~aware and ~sought help',
      value: scalerFunc(data.filter(d => (!(d.awareness) & !(d.expression) & !(d.availability) & !(d.willingness) & !(d.sought_help))),nomalizer),
      category: 'negative behavior', text: "Does not seek help as\n they think they don't need help"
    }, // didn't complete any of the stages in help seeking behavior
      // From Expression to Availability
    {
      source: 'expression', target: 'availability',
      value: scalerFunc(passed_awareness.filter(d => ((d.expression))),nomalizer),
      category: 'positive behavior', text: "Able to explain what they feel"
    },
    {
      source: 'expression', target: 'availability',
      value: scalerFunc(passed_awareness.filter(d => (!(d.expression) & !(!(d.availability) & !(d.willingness) & !(d.sought_help)))), nomalizer),
      category: 'negative behavior', text: "Unable to explain what they feel"
    },
    {
      source: 'expression', target: '~expressive and ~sought help',
      value: scalerFunc(passed_awareness.filter(d => (!(d.expression) & !(d.availability) & !(d.willingness) & !(d.sought_help))), nomalizer),
      category: 'negative behavior' , text: "Does not seek help as\n they are unable to explain"
    },
      // From Availability to Willingness
    {
      source: 'availability', target: 'willingness',
      value: scalerFunc(passed_expression.filter(d => ((d.availability))), nomalizer),
      category: 'positive behavior' , text: "Knows where to find help"
    },
    {
      source: 'availability', target: 'willingness',
      value: scalerFunc(passed_expression.filter(d => (!(d.availability) & !(!(d.willingness) & !(d.sought_help)))),nomalizer),
      category: 'negative behavior', text: "Doesn't know where to find help"
    },
    {
      source: 'availability', target: '~available and ~sought help',
      value: scalerFunc(passed_expression.filter(d => (!(d.availability) & !(d.willingness) & !(d.sought_help))), nomalizer),
      category: 'negative behavior' , text:"Does not seek help as they don't know where to find help"
    },
      // From Willingness to Help
    {
      source: 'willingness', target: 'help',
      value: scalerFunc(passed_availability.filter(d => ((d.willingness))),nomalizer),
      category: 'positive behavior', text: "Willing to seek help"
    },
    {
      source: 'willingness', target: 'help',
      value: scalerFunc(passed_availability.filter(d => ((!(d.willingness)) & (d.sought_help))),nomalizer),
      category: 'negative behavior' , text: "Unwilling to seek help"
    },
    {
      source: 'willingness', target: '~willing and ~sought help',
      value: scalerFunc(passed_availability.filter(d => (!(d.willingness) & !(d.sought_help))),nomalizer),
      category: 'negative behavior', text: "Does not seek help as\n as they are unwilling to seek help"
    },
    // Sought Help or Not
    {
      source: 'help', target: 'sought_help',
      value: scalerFunc(passed_willingness.filter(d => ((d.sought_help))),nomalizer),
      category: 'positive behavior', text: "Sought for help in the end"
    },
    {
      source: 'help', target: 'not_sought_help',
      value: scalerFunc(passed_willingness.filter(d => (!(d.sought_help))),nomalizer),
      category: 'negative behavior', text: "Does not seek help"
    },
    null // Note : In order to support the link popularizing algorithm
  ]
  
  let new_links = []
  let limit = 0

  //the link popularizing algorithm : This multiplies the links by the number of values in each link type
  for (let i = 0; i < links.length; i+=3){
    
    for (let j = 0; j < 3; j++) {

      const temp_link = links[j + i]
      if (temp_link != null) {

        let temp_links = Array(temp_link.value).fill({ source: temp_link.source, target: temp_link.target, value: 1, category: temp_link.category, text: temp_link.text })
  
        for (let index = limit; index < limit + temp_link.value; index++) {
          temp_links[index-limit] = {
            ...temp_links[index-limit],
            start_index: index,
            end_index: j+i %3==2 ? index - limit: index,
            percentage: temp_link.value // percentage to be displayed when hovered over
          }
          
        }
        limit += temp_link.value
        new_links = new_links.concat(temp_links)
        
      }

    }
    limit = 0
  } 

  return {
    links: new_links,
    nodes
  }

}