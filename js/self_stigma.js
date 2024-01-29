d3.csv('../data/mh_data_1.csv', function (d) {

	const categories = {
		1: 'Strongly Disagree',
		2: 'Disagree',
		3: 'Agree & Disagree equally',
		4: 'Agree', // recategorized
		5: 'Strongly Agree',
	};

	return {
		mentalHealthProblem: +d.anymhprob,
		willingness: +d.dep_secret,
		feel_inadequate: categories[+d.stig_self_1],
		feel_inferior: categories[+d.stig_self_2],
		less_satisfied: categories[+d.stig_self_3],
		value: 1,
	};
}).then((data) => {
	let feel_inadequate = d3.group(data, (d) => d.feel_inadequate);

	feel_inadequate = d3.map(feel_inadequate, (d) => {
		return {
			name: 'I would feel inadequate <br>if I went to a therapist <br>for psychological help',
			category: d[0],
			value: d[1].length,
		};
	});

	let feel_inferior = d3.group(data, (d) => d.feel_inferior);

	feel_inferior = d3.map(feel_inferior, (d) => {
		return {
			name: 'It would make me feel <br>inferior to ask <br>a therapist for help',
			category: d[0],
			value: d[1].length,
		};
	});

	let less_satisfied = d3.group(data, (d) => d.less_satisfied);

	less_satisfied = d3.map(less_satisfied, (d) => {
		return {
			name: 'If I went to a therapist, <br>I would be <br>less satisfied with myself',
			category: d[0],
			value: d[1].length,
		};
	});

	let selfstigma = [].concat(feel_inadequate, feel_inferior, less_satisfied);

	d3.rollup(
		selfstigma,
		(group) => {
			const sum = d3.sum(group, (d) => d.value);
			for (const d of group) d.value /= sum;
		},
		(d) => d.name
	);

	chart(selfstigma);
});

function chart(data) {

    // Create tootip

    const formatTooltipValue = (
        (format) => (x) =>
            format(Math.abs(x))
    )(d3.format('.00%'));

		let tooltip = d3
			.select('#bar4')
			.append('div')
			.style('opacity', 0)
			.attr('class', 'tooltip-2')
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
            .html(`${d.category}<br>${formatTooltipValue(d.value)}`)
            .style('left', i.clientX + 20+ 'px')
            .style('top', i.clientY +30 + 'px');
    };

    let mouseleave = function (d) {
        tooltip.style('opacity', 0);
    };
    
    // Specify the chart’s dimensions.
    const width = 1500;
    const height = 400;
    const marginTop = 100;
    const marginRight = 150;
    const marginBottom = 70;
    const marginLeft = 150;

    // Prepare the scales for positional and color encodings.
    // Fx encodes the state.
    const fx = d3
        .scaleBand()
        .domain(new Set(data.map((d) => d.name)))
        .rangeRound([marginLeft, width - marginRight])
        .paddingInner(0.5);

    // Both x and color encode the age class.
    const categories = new Set(['Strongly Disagree', 'Disagree', 'Agree & Disagree equally',
    'Agree', 'Strongly Agree'])

    const x = d3.scaleBand().domain(categories).rangeRound([0, fx.bandwidth()]).padding(0.05);

    const color = d3.scaleOrdinal()
        .domain(categories)
        .range(d3.schemePRGn[categories.size]).unknown('#ccc');

    // Y encodes the height of the bar.
    const y = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.value)])
        .nice()
        .rangeRound([height - marginBottom, marginTop]);

    // A function to format the value in the tooltip.
    const formatValue = (x) => (isNaN(x) ? 'N/A' : `${x * 100}`.toLocaleString('en'));

	// Create the SVG container.
	const svg = d3
		.select('#bar4')
		.append('svg')
		.attr('viewBox', [0, 0, width, height])
        .attr('style', 'margin-top: 15px; margin-bottom: -30px; max-width: 100%; height: auto; font: 10px sans-serif;')
        .attr('preserveAspectRatio', 'xMinYMin meet');
    
    	// Append the vertical axis.
	let y_axis = svg
    .append('g')
    .attr('transform', `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y).tickFormat(formatValue).tickSize(-(width - marginLeft - marginRight)))
    .call((g) => g.selectAll('.domain').remove());
    y_axis.selectAll('line').style('stroke', 'white');
    y_axis.selectAll('text').style('stroke', 'white');

    
	// Append a group for each state, and a rect for each age.
	svg
		.append('g')
		.selectAll()
		.data(d3.group(data, (d) => d.name))
		.join('g')
		.attr('transform', ([state]) => `translate(${fx(state)},0)`)
		.selectAll()
		.data(([, d]) => d)
		.join('rect')
		.attr('x', (d) => x(d.category))
		.attr('y', (d) => y(d.value))
		.attr('width', x.bandwidth())
		.attr('height', (d) => y(0) - y(d.value))
        .attr('fill', (d) => color(d.category))
        .attr('pointer-events', 'visibleFill')
        .on('mouseover', (i, d) => mouseover(i))
        .on('mousemove', (i, d) => mousemove(i, d))
        .on('mouseleave', (i, d) => mouseleave(i));

	// Append the horizontal axis.
	let x_axis = svg
		.append('g')
		.attr('transform', `translate(0,${height - marginBottom})`)
		.call(d3.axisBottom(fx).tickSizeOuter(0))
        .call((g) => g.selectAll('.domain').remove());
    
    x_axis.selectAll('line').style('stroke', 'white');
    x_axis.call((g) => g.selectAll('text').remove());

    let tickName = d3.group(data, (d) => d.name);

    x_axis.call((g) =>
    g
        .selectAll('.tick')
        .data(tickName)
        .append('svg:foreignObject')
        .attr('width', (width- marginLeft- marginRight)/6)
        .attr('height', 105)
        .attr('x', -(width- marginLeft- marginRight)/12)
        .attr('y', 10)
        .attr('text-anchor', 'middle')
        .style('alignment-baseline', 'middle')
        .style('text-align', 'center')
        .append('xhtml:div')
        .style('color', 'white')
            .style('font-weight', '800')
            .style('font-size', '13px')
        .html((d) => `${d[0]}`)
);

    

    		// Add a legend.
	const legend = svg
        .append('g')
        .selectAll('g')
        .data(categories)
        .join('g')
        .attr('transform', (d, i) => `translate(${i * (width-marginRight)/5 + 150}, 0)`);

    legend
        .append('rect')
        .attr('width', 25)
        .attr('height', 25)
        .attr('fill', color);
    
    legend
    .append('svg:foreignObject')
    .attr('width', (width- marginLeft- marginRight)/5)
    .attr('height', 105)
    .attr('x', (width-marginRight)/5 - 235)
    .attr('y', 5)
    .attr('text-anchor', 'start')
    .style('alignment-baseline', 'middle')
    .style('text-align', 'left')
    .append('xhtml:div')
    .style('color', 'white')
        .style('font-weight', '800')
        .style('font-size', '13px')
    .html((d) => `${d}`)

    // Return the color scale as a property of the node, for the legend.
    return Object.assign(svg.node(), { scales: { color } });
}
