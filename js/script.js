/* Load the dataset and formatting variables
  Ref: https://www.d3indepth.com/requests/ */

d3.csv('../data/mh_data_1.csv', (d) => {
	return {
		mentalHealthProblem: +d.anymhprob,
		haveTakenMeds: +d.meds_any,
		txAny: +d.tx_any,
		haveInformalHelp: +d.inf_any,
		haveTherapy: +d.ther_any,
		awareness: +d.percneed,
		expression: +d.know_sp,
		availability: +d.knowwher,
		willingness: +d.dep_secret,
	};
}).then((data) => {
	/* Data Manipulation in D3
    Ref: https://observablehq.com/@d3/d3-extent?collection=@d3/d3-array */

	console.log('Data before formatting', data);

	data = data.map((d) => {
		return {
			mentalHealthProblem: d.mentalHealthProblem == 1,
			sought_help: d.haveTakenMeds + d.txAny + d.haveInformalHelp + d.haveTherapy > 0,
			awareness: d.awareness < 4,
			expression: d.expression < 3,
			availability: d.availability < 4,
			willingness: d.willingness > 2,
		};
	});

	console.log('Data after formatting', data);

	stageButtons();
	createMainFlowChart(data);

	// All data are categorical.
});

const stageButtons = () => {
	d3.selectAll('.button_click').on('mouseover', function () {
		let buttonID = d3.select(this).attr('id');
		zoom(buttonID);
	});

	d3.selectAll('.button_click').on('mouseleave', function () {
		let buttonID = d3.select(this).attr('id');
		zoomOut(buttonID);
	});
};

function zoom(buttonID) {
	const stages = {
		awareness: {
			description: `<h2 style="font-size:500">AWARENESS:</h2>
      It is the ability to recognize symptoms(like behavioral issues with peers), and that you have a problem that may require intervention
      from someone else. <br><br>
      This is assessed by whether they identified their emotions (like sad, blue, anxious) and realised that they should seek help from someone.<br><br>
      Only 1% of individuals exhibit a deviation from this typical behavior, either struggling to recognize symptoms or acknowledging the need for help, or both.
    `,
			color: '#ff00b4',
		},
		expression: {
			description: `<h2 style="font-size:500">EXPRESSION:</h2>
      It is the ability to articulate (the awareness) and express in words the state they are in, which can be understood by others and they should be
       comfortable in doing so. <br><br>
       This is assessed by how knowledgeable are they about their mental illnesses (such as depression, anxiety disorders) and if they can express clearly.<br><br>
       Only 2% of individuals exhibit a deviation from this typical behavior, either struggling to express the need clearly or are not comfortable, or both.`,
			color: '#00ffbc',
		},
		availability: {
			description: `<h2 style="font-size:500">AVAILABILITY:</h2>
      It is the sources of help and support in dealing with the mental illness problems that need to be available and accessible and the help-seeker must have an understanding of where/how to get that support.<br><br>
      This is assessed by how knowledgeable are the students about the where to find professional help and resources for seeking mental help.<br><br> 
      Only 1% of individuals exhibit a deviation from this typical behavior, struggling to find professional help because it is either not available or not accessible, or both.`,
			color: '#8ea5ff',
		},
		willingness: {
			description: `<h2 style="font-size:500">WILLINGNESS:</h2>
      The help-seeker must be willing and able to disclose their inner state to the source of help.<br><br>      
      This is assessed by how open/willing are the students to disclose their inner state when seeking professional help.<br><br>  
      Only 8% of individuals exhibit a deviation from this typical behavior, struggling to not openly discuss about their inner state and keeping their feelings to themselves.`,
			color: '#c493ff',
		},
		'sought-help': {
			description: `<h2 style="font-size:500">SOUGHT HELP:</h2>
      Every phase of the help-seeking process poses its own challenges making their journey to seek help difficult.<br><br>
      Successfully passing all the phases, it is very interesting to report that most of the survey respondents, around 81%, stepped up and sought help.`,
			color: '#ffac00',
		},
		'did-not-seek-help': {
			description: `<h2 style="font-size:500">DID NOT SEEK HELP:</h2>
      Every phase of the help-seeking process poses its own challenges making their journey to seek help difficult.<br><br>
      But despite passing through all the phases, it is strange to see that there are some individuals (6%) that unfortunately do not seek help.`,
			color: '#000000',
		},
	};

	d3.selectAll('.stage-desc').attr('stroke', stages[buttonID].color);

	d3.select('#stage-desc-1').html(
		`<div style="color:${stages[buttonID].color};  font-size:800px; font-weight: 700;">${stages[buttonID].description}</div>`
	);

	d3.selectAll('.stage-desc').transition().duration(1000).attr('opacity', 1);

	d3.select(`#stage-${buttonID}`).transition().duration(1000).style('font-size', '1000px');

	buttonID = buttonID.includes('-') ? `.point-${buttonID}_end` : `.point-${buttonID}_fallout`;
	d3.selectAll(buttonID).transition().duration(1000).attr('r', 500);
}

function zoomOut(buttonID) {
	d3.select(`#stage-${buttonID}`).transition().duration(1000).style('font-size', '800px');

	d3.selectAll('.stage-desc').transition().duration(1000).attr('opacity', 0);

	buttonID = buttonID.includes('-') ? `.point-${buttonID}_end` : `.point-${buttonID}_fallout`;
	d3.selectAll(buttonID).transition().duration(1000).attr('r', 200);
}

const createMainFlowChart = (data) => {
	/* Set the dimensions and margins of the graph
    Ref: https://observablehq.com/@d3/margin-convention */

	const width = 80000,
		height = 42000;

	data = dataProcessingForMainFlowChart(data, width, height);

	// Create a SVG container.
	d3.select('#bar').attr('style', `margin-top: 30px; margin-bottom: 50px; max-width: 88%`);

	const svg = d3
		.select('#bar')
		.append('svg')
		.attr('viewBox', [0, 0, width, height])
		.attr(
			'style',
			'max-width: 100%; max-height: 100%; font: 10px sans-serif; background-color:#ffffff; outline: thin solid #E0E0E0; '
		)
		.attr('preserveAspectRatio', 'xMinYMin meet');

	const defs = svg.append('svg:defs');
	let gradient = defs
		.append('svg:linearGradient')
		.attr('id', 'gradient')
		.attr('x1', '50%')
		.attr('y1', '0%')
		.attr('x2', '50%')
		.attr('y2', '100%')
		.attr('spreadMethod', 'pad');

	// Define the gradient colors
	gradient.append('svg:stop').attr('offset', '0%').attr('stop-color', 'white');

	gradient.append('svg:stop').attr('offset', '100%').attr('stop-color', '#001eff');

	// Create tootip
	let tooltip = d3
		.select('#bar')
		.append('div')
		.style('opacity', 0)
		.attr('class', 'tooltip')
		.style('background-color', 'white')
		.style('border', 'solid')
		.style('border-width', '2px')
		.style('border-radius', '5px')
		.style('padding', '10px')
		.style('font-size', '15px')
		.style('text-align', 'center');

	let mouseover = function (d) {
		tooltip.style('opacity', 1);
	};
	let mousemove = function (i, d) {
		tooltip
			.html(`${d.text}<br>${d.percentage}%`)
			.style('left', i.clientX + 10 + 'px')
			.style('top', i.clientY + 10 + 'px');
	};

	let mouseleave = function (d) {
		tooltip.style('opacity', 0);
	};

	// Constructs and configures a Sankey generator.
	const sankey = d3
		.sankey()
		.nodeId((d) => d.name)
		.nodeWidth(100)
		.nodePadding(500);

	// Applies it to the data. We make a copy of the nodes and links objects
	// so as to avoid mutating the original.
	const { nodes, links } = sankey({
		nodes: data.nodes.map((d) => Object.assign({}, d)),
		links: data.links.map((d) => Object.assign({}, d)),
	});

	let legend = ['positive_behavior', 'negative_behavior', 'sought help', 'did not seek help'];
	let colorScale = d3.scaleOrdinal().domain(legend).range(['#262626', '#262626', '#ffac00', '#000000']);

	let brainColorScale = d3.scaleOrdinal().domain(legend).range(['#3d144c']);

	// The stage description box
	let stage_desc = svg.append('g');

	stage_desc
		.append('rect')
		.attr('class', 'stage-desc')
		.attr('opacity', 0)
		.attr('x', 1000)
		.attr('y', 1000)
		.attr('width', 30000)
		.attr('height', 15000)
		.attr('stroke', 'black')
		.attr('stroke-width', '100px')
		.attr('rx', 600)
		.attr('ry', 600)
		.attr('fill', '#ffffff');

	stage_desc
		.append('foreignObject')
		.attr('opacity', 1)
		.attr('class', 'stage-desc')
		.attr('id', 'stage-desc-1')
		.attr('width', 27000)
		.attr('height', 12500)
		.style('background-color', 'white')
		.style('padding', '10px')
		.attr('text-anchor', 'left')
		.style('alignment-baseline', 'middle')
		.style('text-align', 'left')
		.attr('x', 2500)
		.attr('y', 1100);

	// Creates the transparent circles that represent the nodes.
	const circle_node = svg
		.append('g')
		.selectAll('.node')
		.data(nodes)
		.enter()
		.append('g')
		.attr('class', 'node')
		.attr('transform', (d) => `translate(${d.x}, ${d.y})`);

	circle_node
		.append('circle')
		.attr('r', 1)
		.attr('fill', (d) => colorScale(d.name));

	let text_placements = {
		mentalHealthProblem: [0, 4000, 600],
		awareness: [35, 8000, -3000],
		'~aware and ~sought help': [0, -1500, -1500],
		expression: [-75, 9000, 10000],
		'~expressive and ~sought help': [0, -900, -1000],
		availability: [55, 11000, -3500],
		'~available and ~sought help': [0, -1500, -1000],
		willingness: [-57, 2000, 7200],
		'~willing and ~sought help': [0, -7500, 27000],
		help: [0, 0, 0],
		sought_help: [0, -4200, 4000],
		not_sought_help: [0, 19500, -8000],
	};

	// Adds a title on the nodes.
	circle_node
		.append('text')
		.attr('id', (d) => `stage-${d.name}`)
		.text((d) => `${d.text}`)
		.style('font-size', '800px')
		.style('font-weight', 700)
		.attr('dy', '.35em')
		.attr('text-anchor', 'middle')
		.attr(
			'transform',
			(d) =>
				`rotate(${text_placements[d.name][0]}) translate(${text_placements[d.name][1]},${text_placements[d.name][2]})`
		)
		.attr('fill', (d) => {
			return d.color;
		})
    .attr('text-shadow', '1px 1px 2px red, 0 0 1em blue, 0 0 0.2em blue')
    .on('mouseover', (i, d) => {
      zoom(d.name);
    })
    .on('mouseleave', (i,d)=> {
      zoomOut(d.name);
    });

	// Creates the paths that represent the links.
	const link = svg
		.append('g')
		.attr('fill', 'none')
		// .attr("stroke-opacity", 1)
		.selectAll()
		.data(links)
		.join('g')
		.style('mix-blend-mode', 'normal');
	// .style("mix-blend-mode", "multiply");

	let y_multiplier = 70; // to add space between links to make them look like strands

	let curve = d3
		.link(d3.curveBumpX)
		.source((d) => [
			d.source.x + (d.source.index_axis == 0 ? d.start_index * y_multiplier : 0),
			d.source.y + (d.source.index_axis == 1 ? d.start_index * y_multiplier : 0),
		])
		.target((d) => [
			d.target.x + (d.target.index_axis == 0 ? d.end_index * y_multiplier : 0),
			d.target.y + (d.target.index_axis == 1 ? d.end_index * y_multiplier : 0),
		])

	link
		.append('path')
		.attr('d', (d) => getPath(d, curve, y_multiplier))
		.attr('stroke', (d) => {
			return brainColorScale(Math.round(d.start_index / 4));
		})
		.attr('stroke-width', 50)
		.attr('pointer-events', 'visibleStroke')
		.on('mouseover', (i, d) => mouseover(i))
		.on('mousemove', (i, d) => mousemove(i, d))
		.on('mouseleave', (i, d) => mouseleave(i));

	link
		.append('circle')
		.attr('class', (d) => {
			if (d.target.terminal_phase) {
				return `point-${d.name}`;
			}
		})
		.attr('cx', (d) => {
			if (d.target.terminal_phase && d.path.includes('IntPointX')) {
				let sourceX = d.source.x + (d.source.index_axis == 0 ? d.start_index * y_multiplier : 0);
				let rho =
					(2 *
						Math.PI *
						(d.intPoint.angle.start + (d.end_index * 15 * d.intPoint.angle.end - d.intPoint.angle.start) / 360)) /
					360;
				let targetX = Math.cos(rho) * (d.target.y + d.intPoint.random - d.source.y);
				return sourceX + targetX + (d.target.end ? 5000 : 0);
			} else {
				return (
					d.target.x -
					(d.target.terminal_phase & (d.category == 'positive behavior')
						? Math.floor(Math.random() * 300)
						: d.target.terminal_phase
						? Math.floor(Math.random() * 100)
						: 0)
				);
			}
		})
		.attr('cy', (d) => {
			if (d.target.terminal_phase && d.path.includes('IntPointX')) {
				let sourceY = d.source.y + (d.source.index_axis == 1 ? d.start_index * y_multiplier : 0);
				let rho =
					(2 *
						Math.PI *
						(d.intPoint.angle.start + (d.end_index * 15 * d.intPoint.angle.end - d.intPoint.angle.start) / 360)) /
					360;
				let targetY = d.target.end
					? Math.sin(rho) * (d.target.y + d.intPoint.random - d.source.y)
					: (d.intPoint.targetAbove ? -1 : 1) * Math.abs(Math.sin(rho) * (d.target.y + d.intPoint.random - d.source.y));
				return sourceY + targetY;
			} else {
				return d.target.y + d.end_index * y_multiplier;
			}
		})
		.attr('r', (d) => (d.target.terminal_phase ? 200 : 0))
		.attr('stroke', 'black')
		.attr('stroke-width', 10)
		.attr('fill', (d) => colorScale(d.category == 'positive behavior' ? 'sought help' : 'did not seek help'))
		.on('mouseover', (i, d) => {
      if (d.target.terminal_phase) {
        
        d3.selectAll(`.legend-text-${d.name.split('_')[0]}`)
        .transition()
        .duration(1000)
          .style('font-size', '1200px');
        
        d3.select(`.legend-circle-${d.name.split('_')[0]}`)
          .transition()
          .duration(1000)
          .attr('r', 700);
        
				zoom(d.name.split('_')[0]);
			}
		})
		.on('mouseleave', (i, d) => {
      if (d.target.terminal_phase) {
        
        d3.selectAll(`.legend-text-${d.name.split('_')[0]}`)
        .transition()
        .duration(1000)
          .style('font-size', '800px');
        
        d3.select(`.legend-circle-${d.name.split('_')[0]}`)
        .transition()
        .duration(1000)
          .attr('r', 500);
        
				zoomOut(d.name.split('_')[0]);
			}
		});

	let size = 500;

	const legend_display = legend.slice(2, 4);

	// Create legend
	svg
		.append('g')
		.selectAll()
		.data(legend_display)
		.join('circle')
		.attr('class', (d) => `legend-circle-${d.split(' ').join('-')}`)
		.attr('cx', width - 12000)
		.attr('cy', function (d, i) {
			return height - (1000 + (2 - i) * (size + 1000));
		})
		.attr('r', size)
		.style('fill', function (d) {
			return colorScale(d);
		})
		.on('mouseover', function () {
			d3.select(this).transition().duration(1000).attr('r', 700);

			let type = d3.select(this).attr('class');

			d3.select(`.${type.replace('circle', 'text')}`)
				.transition()
				.duration(1000)
				.style('font-size', '1200px');

			zoom(type.replace('legend-circle-', ''));
		})
		.on('mouseleave', function () {
			d3.select(this).transition().duration(1000).attr('r', 500);

      let type = d3.select(this).attr('class');
    
      d3.select(`.${type.replace('circle', 'text')}`)
      .transition()
      .duration(1000)
        .style('font-size', '800px');
      
			zoomOut(type.replace('legend-circle-', ''));
		});

	// Add one dot in the legend for each name.
	svg
		.append('g')
		.selectAll()
		.data(legend_display)
		.join('text')
		.attr('class', (d) => `legend-text-${d.split(' ').join('-')}`)
		.attr('x', width - 10500)
		.attr('y', (d, i) => {
			return height - (1000 + (2 - i) * (size + 1000));
		})
		.style('fill', (d) => {
			return colorScale(d);
		})
		.text((d) => {
			return `${d}`;
		})
		.attr('text-anchor', 'left')
		.style('alignment-baseline', 'middle')
		.style('font-size', '800px')
		.style('font-weight', 700)
		.on('mouseover', function () {
			d3.select(this).transition().duration(1000).style('font-size', '1200px');

			let type = d3.select(this).attr('class');

      d3.select(`.${type.replace('text', 'circle')}`)
        .transition()
        .duration(1000)
			  .attr('r', 700);

			zoom(type.replace('legend-text-', ''));
		})
		.on('mouseleave', function () {
			d3.select(this).transition().duration(1000).style('font-size', '800px');

      let type = d3.select(this).attr('class');
      
      d3.select(`.${type.replace('text', 'circle')}`)
        .transition()
        .duration(1000)
      .attr('r', 500);
			zoomOut(type.replace('legend-text-', ''));
		});
	
	
		let final_desc = svg.append('g');

		final_desc
			.append('rect')
			.attr('class', 'final-desc')
			.attr('opacity', 1)
			.attr('x', 55000)
			.attr('y', 30000)
			.attr('width', 9000)
			.attr('height', 5000)
			.attr('stroke', '#c493ff')
			.attr('stroke-width', '100px')
			.attr('rx', 600)
			.attr('ry', 600)
			.attr('fill', '#ffffff');
	
		final_desc
			.append('foreignObject')
			.attr('opacity', 1)
			.attr('class', 'final-desc')
			.attr('id', 'final-desc-1')
			.attr('width', 8500)
			.attr('height', 3800)
			.style('background-color', 'white')
			.style('padding', '10px')
			.attr('text-anchor', 'left')
			.style('alignment-baseline', 'middle')
			.style('text-align', 'center')
			.attr('x', 55250)
			.attr('y', 31000)
			.html(
				`<div style="color:#c493ff; font-size:700px; font-weight: 700;">
				The largest fallout is during the stage of WILLINGNESS
				</div>`
			);;


	return svg.node();
};

function getPath(d, curve, y_multiplier) {
	if (d.target.terminal_phase == true) {
		let sourceX = d.source.x + (d.source.index_axis == 0 ? d.start_index * y_multiplier : 0);
		let sourceY = d.source.y + (d.source.index_axis == 1 ? d.start_index * y_multiplier : 0);
		let path = d.path.replace('SourceX', sourceX).replace('SourceY', sourceY);

		if (d.path.includes('IntPointX')) {
			let rho =
				(2 *
					Math.PI *
					(d.intPoint.angle.start + (d.end_index * 15 * d.intPoint.angle.end - d.intPoint.angle.start) / 360)) /
				360;
			let targetX = Math.cos(rho) * (d.target.y + d.intPoint.random - d.source.y);
			let targetY = d.target.end
				? Math.sin(rho) * (d.target.y + d.intPoint.random - d.source.y)
				: (d.intPoint.targetAbove ? -1 : 1) * Math.abs(Math.sin(rho) * (d.target.y + d.intPoint.random - d.source.y));

			path = path
				.replace('IntPointX', d.intPoint.x)
				.replace('IntPointY', d.intPoint.y)
				.replace('RelTargetX', targetX)
				.replace('RelTargetY', targetY);
		} else {
			path = path
				.replace(
					'RelTargetX',
					d.target.x - (d.source.x + (d.source.index_axis == 0 ? d.start_index * y_multiplier : 0))
				)
				.replace(
					'RelTargetY',
					d.target.y - (d.source.y + (d.source.index_axis == 1 ? d.start_index * y_multiplier : 0))
				);
		}
		return path;
	} else {

		if (d.path != null) {
			if (d.path.includes('Control1X')) {

				let sourceX = d.source.x + (d.source.index_axis == 0 ? d.start_index * y_multiplier : 0)
				let sourceY = d.source.y + (d.source.index_axis == 1 ? d.start_index * y_multiplier : 0)
				let targetX = d.target.x + (d.target.index_axis == 0 ? d.end_index * y_multiplier : 0)
				let targetY = d.target.y + (d.target.index_axis == 1 ? d.end_index * y_multiplier : 0)

				let path = d.path.replace('SourceX', sourceX).replace('SourceY', sourceY)
					.replace('Control1X', d.controlPoint.x1 + (d.target.name == 'awareness' ?  (-d.start_index * 10):
						(d.target.name == 'availability' ? (d.start_index * 50) :
							(d.target.name == 'willingness'? (-d.start_index * 45): 0))))
					.replace('Control2X', d.controlPoint.x2 + (d.target.name == 'awareness' ? (d.start_index * 10):
						(d.target.name == 'availability' ? (d.start_index * 65) :
							(d.target.name == 'willingness' ? 0 : 0))))
					.replace('Control2Y',d.controlPoint.y2 + (d.target.index_axis == 1 ? d.end_index * y_multiplier : 0))
					.replace('RelTargetX', targetX - sourceX)
					.replace('RelTargetY', targetY - sourceY);

				return path
			}

		} else {
			return curve(d);
		}
	}
}

function closeModal() {
	d3.select('.overlay').style('display', 'none');
}

// Function to handle mouseover event
function handleMouseOver(d) {
	d3.select(`#${d.graph}`).transition().duration(200).attr('r', 5000); // Increase the radius on hover

	d3.select(`#text_${d.graph}`).transition().duration(200).style('font-size', '800px').style('font-weight', 700);
}

// Function to handle mouseout event
function handleMouseOut(d) {
	d3.select(`#${d.graph}`).transition().duration(200).attr('r', 800); // Restore the original radius on mouseout

	d3.select(`#text_${d.graph}`).transition().duration(200).style('font-size', '0').style('font-weight', 0);
}

const scalerFunc = (data, normalizer) => {
	return Math.round(data.length / normalizer);
};

const dataProcessingForMainFlowChart = (data, width, height) => {
	const margins = { top: height / 21, bottom: height / 21, left: width / 40, right: width / 40 };

	// This function scales and transforms the data according to the required format for the graph
	// Nodes -> Each phase of menatal health help seeking behavior (Not shown in the graph as nodes, but created for the purpose of creating links
	// and displaying details related to phases)
	// Link -> Transition from one stage to another

	let nomalizer = data.length / 100; //Used to generate percentages (graph shows a summary)

	let passed_awareness = data.filter(
		(d) => !(!d.awareness & !d.expression & !d.availability & !d.willingness & !d.sought_help)
	);
	let passed_expression = passed_awareness.filter(
		(d) => !(!d.expression & !d.availability & !d.willingness & !d.sought_help)
	);
	let passed_availability = passed_expression.filter((d) => !(!d.availability & !d.willingness & !d.sought_help));
	let passed_willingness = passed_availability.filter((d) => !(!d.willingness & !d.sought_help));

	let nodes = [
		// {name: NodeID,
		//text: To be displayed on the flow,
		//subtext : To be displayed when hovered over
		// x: x position of the node, y: position of the node,
		//terminal_phase: Used to identify whether the node is a terminal phase or an intermediate phase ,
		//index_axis: Axis to distribute the links at connection nodes - 1 indicates along the y axis and 0 indicates along the x axis },

		{
			name: 'mentalHealthProblem',
			text: 'HAVE \nMENTAL \nILLNESS',
			subtext: '',
			x: margins.left,
			y: height - margins.bottom,
			terminal_phase: false,
			end: false,
			index_axis: 0,
			path: '',
		},
		{
			name: 'awareness',
			text: `AWARENESS OF ILLNESS`,
			subtext: `${scalerFunc(passed_awareness, nomalizer)}%`,
			x: (2 * width) / 12,
			y: (8 * height) / 14,
			terminal_phase: false,
			index_axis: 1,
			path: 'M 5712 -1782 c 3147 260 3000 5900 9000 5500',
			color: '#ff00b4',
		},
		{
			name: '~aware and ~sought help',
			text: `${scalerFunc(
				data.filter((d) => !d.awareness & !d.expression & !d.availability & !d.willingness & !d.sought_help),
				nomalizer
			)}%`,
			subtext: '',
			x: (2 * width) / 18,
			y: (7 * height) / 14,
			terminal_phase: true,
			end: false,
			index_axis: 1,
			path: '',
		},
		{
			name: 'expression',
			text: `ABILITY TO EXPRESS`,
			subtext: `${scalerFunc(passed_expression, nomalizer)}%`,
			x: (4 * width) / 12,
			y: (height * 5) / 7,
			terminal_phase: false,
			end: false,
			index_axis: 1,
			path: '',
			color: '#00ffbc',
			// 'M 8485 -1657 c 3347 -1694 -21 -6838 3387 -8056'
		},
		{
			name: '~expressive and ~sought help',
			text: `${
				scalerFunc(
					passed_awareness.filter((d) => !d.expression & !d.availability & !d.willingness & !d.sought_help),
					nomalizer
				) + 1
			}%`,
			subtext: '',
			x: (5 * width) / 17,
			y: (17 * height) / 18,
			terminal_phase: true,
			end: false,
			index_axis: 1,
			path: '',
		},
		{
			name: 'availability',
			text: `AVAILABILITY OF HELP`,
			subtext: `${scalerFunc(passed_availability, nomalizer)}%`,
			x: (6 * width) / 12,
			y: height / 7,
			terminal_phase: false,
			end: false,
			index_axis: 1,
			path: '',
			color: '#8ea5ff',
			// 'M 8065 1831 c 4151 91 1545 6607 6243 6485'
		},
		{
			name: '~available and ~sought help',
			text: `${scalerFunc(
				passed_expression.filter((d) => !d.availability & !d.willingness & !d.sought_help),
				nomalizer
			)}%`,
			subtext: '',
			x: (8 * width) / 18,
			y: (2 * height) / 16,
			terminal_phase: true,
			end: false,
			index_axis: 1,
			path: '',
		},
		{
			name: 'willingness',
			text: `WILLINGNESS TO SHARE`,
			subtext: `${scalerFunc(passed_willingness, nomalizer)}%`,
			x: (8 * width) / 12,
			y: (3 * height) / 7,
			terminal_phase: false,
			end: false,
			index_axis: 1,
			path: 'M 6423 5955 c 4176 -126 1107 -6619 5501 -7734',
			color: '#c493ff',
		},
		{
			name: '~willing and ~sought help',
			text: `${scalerFunc(
				passed_availability.filter((d) => !d.willingness & !d.sought_help),
				nomalizer
			)}%`,
			subtext: '',
			x: (8 * width) / 12,
			y: height / 6,
			terminal_phase: true,
			end: false,
			index_axis: 1,
			path: '',
		},
		{
			name: 'help',
			text: '',
			subtext: '',
			x: (10 * width) / 12,
			y: (7 * height) / 42,
			terminal_phase: false,
			end: false,
			index_axis: 1,
			path: '',
		},
		{
			name: 'sought_help',
			text: ``,
			subtext: `${scalerFunc(
				passed_willingness.filter((d) => d.sought_help),
				nomalizer
			)}%`,
			x: width - margins.right,
			y: (3 * height) / 9,
			terminal_phase: true,
			end: true,
			index_axis: 1,
			path: '',
		},
		{
			name: 'not_sought_help',
			text: `${scalerFunc(
				passed_willingness.filter((d) => !d.sought_help),
				nomalizer
			)}%`,
			subtext: '',
			x: (6 * width) / 12,
			y: (2 * height) / 7,
			terminal_phase: true,
			end: false,
			index_axis: 1,
			path: '',
		},
	];

	let links = [
		// Initialization of link types
		// {
		//   source: The source node
		//   target: The target node
		//   value: scaled number of people transitioning from one phase to the next
		//   category: Whether the link represents a positive behavior or a negative behaviour at this stage
		//   text: Text to  be displayed when hovered over the link
		// }

		[
			{
				source: 'mentalHealthProblem',
				target: 'awareness',
				value: scalerFunc(data, nomalizer),
				controlPoint: {
					x1: 5666.667,
					x2: 5666.667,
					y2:-16000
				},
				path: 'MSourceX,SourceYcControl1X,0,Control2X,Control2Y,RelTargetX,RelTargetY',
				text: '',
				dif_end: false,
			},
		],
		// From Awareness to Expression
		[
			{
				name: 'awareness_fallout',
				source: 'awareness',
				target: '~aware and ~sought help',
				value: scalerFunc(
					data.filter((d) => !d.awareness & !d.expression & !d.availability & !d.willingness & !d.sought_help),
					nomalizer
				),
				path: 'MSourceX,SourceYc5000,-1000,-1000,-5000,RelTargetX,RelTargetY',
				text: "Does not seek help as\n they think they don't need help",
				dif_end: true,
			},
			{
				source: 'awareness',
				target: 'expression',
				value: scalerFunc(
					data.filter(
						(d) => d.awareness || !d.awareness & !(!d.expression & !d.availability & !d.willingness & !d.sought_help)
					),
					nomalizer
				),
				text: 'They know they need help',
				dif_end: false,
			},

		], // didn't complete any of the stages in help seeking behavior
		// From Expression to Availability
		[
			{
				source: 'expression',
				target: 'availability',
				value: scalerFunc(
					passed_awareness.filter(
						(d) => d.expression || !d.expression & !(!d.availability & !d.willingness & !d.sought_help)
					),
					nomalizer
				),
				controlPoint: {
					x1: 6666.666,
					x2: 6666.666
				},
				path : 'MSourceX,SourceYcControl1X,0,Control2X,-24000,RelTargetX,RelTargetY',
				text: 'Able to explain what they feel',
				dif_end: false,
			},
			{
				name: 'expression_fallout',
				source: 'expression',
				target: '~expressive and ~sought help',
				value: scalerFunc(
					passed_awareness.filter((d) => !d.expression & !d.availability & !d.willingness & !d.sought_help),
					nomalizer
				),
				path: 'MSourceX,SourceYq10000,1000,RelTargetX,RelTargetY',
				text: 'Does not seek help as\n they are unable to explain',
				dif_end: true,
			},
		],
		// From Availability to Willingness
		[
			{
				name: 'availability_fallout',
				source: 'availability',
				target: '~available and ~sought help',
				value: scalerFunc(
					passed_expression.filter((d) => !d.availability & !d.willingness & !d.sought_help),
					nomalizer
				),
				path: 'MSourceX,SourceYc5000,0,-2000,-5000,RelTargetX,RelTargetY',
				text: "Does not seek help as they don't know where to find help",
				dif_end: true,
			},
			{
				source: 'availability',
				target: 'willingness',
				value: scalerFunc(
					passed_expression.filter((d) => d.availability || !d.availability & !(!d.willingness & !d.sought_help)),
					nomalizer
				),
				controlPoint: {
					x1: 6666.667,
					x2: 6666.667
				},
				path :'MSourceX,SourceYcControl1X,0,Control2X,12000,RelTargetX,RelTargetY',
				text: 'Knows where to find help',
				dif_end: false,
			},
		],
		// From Willingness to Help
		[
			{
				source: 'willingness',
				target: 'help',
				value: scalerFunc(
					passed_availability.filter((d) => d.willingness || !d.willingness & d.sought_help),
					nomalizer
				),
				category: 'positive behavior',
				text: 'Willing to seek help',
				dif_end: false,
			},
			{
				name: 'willingness_fallout',
				source: 'willingness',
				target: '~willing and ~sought help',
				intPoint: {
					x: 5000,
					y: -1000,
					angle: {
						start: 45,
						end: 90,
					},
				},
				value: scalerFunc(
					passed_availability.filter((d) => !d.willingness & !d.sought_help),
					nomalizer
				),
				path: 'MSourceX,SourceYqIntPointX,IntPointY,RelTargetX,RelTargetY',
				// 'MSourceX,SourceYq8314,-1584,RelTargetX,RelTargetY',
				category: 'negative behavior',
				text: 'Does not seek help as\n as they are unwilling to seek help',
				dif_end: true,
			},
		],
		// Sought Help or Not
		[
			{
				name: 'did-not-seek-help_end',
				source: 'help',
				target: 'not_sought_help',
				value: scalerFunc(
					passed_willingness.filter((d) => !d.sought_help),
					nomalizer
				),
				intPoint: {
					x: 5000,
					y: -1000,
					angle: {
						start: 180,
						end: 270,
					},
					targetAbove: true,
				},
				path: 'MSourceX,SourceYqIntPointX,IntPointY,RelTargetX,RelTargetY',
				category: 'negative behavior',
				text: 'Does not seek help',
				dif_end: true,
			},
			{
				name: 'sought-help_end',
				source: 'help',
				target: 'sought_help',
				value: scalerFunc(
					passed_willingness.filter((d) => d.sought_help),
					nomalizer
				),
				intPoint: {
					x: 5000,
					y: -1000,
					angle: {
						start: -60,
						end: 45,
					},
					targetAbove: false,
				},
				path: 'MSourceX,SourceYl5000,0qIntPointX,IntPointY,RelTargetX,RelTargetY',
				category: 'positive behavior',
				text: 'Sought for help in the end',
				dif_end: false,
			},
		],
	];

	let new_links = [];

	//the link popularizing algorithm : This multiplies the links by the number of values in each link type
	for (let i = 0; i < links.length; i++) {
		let limit = 0;
		for (let j = 0; j < links[i].length; j++) {
			const temp_link = links[i][j];
			let temp_links = Array(temp_link.value).fill({
				source: temp_link.source,
				target: temp_link.target,
				value: 1,
				category: temp_link.category,
				text: temp_link.text,
				path: temp_link.path,
				dif_end: temp_link.dif_end,
				intPoint: temp_link.intPoint,
				controlPoint: temp_link.controlPoint,
				name: temp_link.name,
			});

			for (let index = limit; index < limit + temp_link.value; index++) {
				temp_links[index - limit] = {
					...temp_links[index - limit],
					intPoint: {
						...temp_links[index - limit].intPoint,
						random: Math.random() * 800,
					},
					start_index: index,
					end_index: temp_link.dif_end ? index - limit : index,
					percentage: temp_link.value, // percentage to be displayed when hovered over
				};
			}
			limit += temp_link.value;
			new_links = new_links.concat(temp_links);
		}
	}

	return {
		links: new_links,
		nodes,
	};
};
