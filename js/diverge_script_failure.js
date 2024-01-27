d3.csv('../data/mh_data_1.csv', function (d) {
	const categories = {
		1: 'Strongly Agree',
		2: 'Agree',
		3: 'Somewhat Agree',
		4: 'Somewhat Disagree', // recategorized
		5: 'Disagree',
		6: 'Strongly Disagree',
	};

	return {
		mentalHealthProblem: +d.anymhprob,
		willingness: +d.dep_secret,
		perceived_stig: categories[+d.stig_pcv_3],
		personal_stig: categories[+d.stig_per_3],
		value: 1,

		// name: data.speaker,
		// category: categories[data.ruling],
		// value: +data.count
	};
	// categories[category] ? { data.name, category: categories[category], value: +value } : null}
})
	.then((data) => {
		let perceived_stigma = d3.group(data, (d) => d.perceived_stig);

		perceived_stigma = d3.map(perceived_stigma, (d) => {
			return {
				name: 'Most people feel that<br> receiving mental health treatment<br> is a sign of personal failure',
				category: d[0],
				value: d[1].length,
			};
		});

		let personal_stigma = d3.group(data, (d) => d.personal_stig);

		personal_stigma = d3.map(personal_stigma, (d) => {
			return {
				name: 'I feel that receiving<br> mental health treatment<br> is a sign of personal failure',
				category: d[0],
				value: d[1].length,
			};
		});

		let stigma = [].concat(perceived_stigma, personal_stigma);

		// Normalize absolute values to percentage.
		d3.rollup(
			stigma,
			(group) => {
				const sum = d3.sum(group, (d) => d.value);
				for (const d of group) d.value /= sum;
			},
			(d) => d.name
		);

		console.log(stigma);

		return Object.assign(stigma, {
			negative: '← Disagree',
			positive: 'Agree →',
			negatives: ['Strongly Disagree', 'Disagree', 'Somewhat Disagree'],
			positives: ['Somewhat Agree', 'Agree', 'Strongly Agree'],
		});
	})
	.then((data) => {
		// Assign a valence to each category.
		const signs = new Map(
			[].concat(
				data.negatives.map((d) => [d, -1]),
				data.positives.map((d) => [d, +1])
			)
		);

		// Compute the bias = sum of negative values for each candidate.
		const bias = d3.sort(
			d3.rollup(
				data,
				(v) => d3.sum(v, (d) => d.value * Math.min(0, signs.get(d.category))),
				(d) => d.name
			),
			([, a]) => a
		);

		// Specify the chart’s dimensions, with a space of height 33px for each candidate.
		const width = 928;
		const marginTop = 100;
		const marginRight = 150;
		const marginBottom = 0;
		const marginLeft = 200;
		const height = bias.length * 53 + marginTop + marginBottom;

		// Prepare the stack; the values are stacked from the inside out, starting with more
		// moderate values (“mostly false”, “half true”), and ending with the extreme values.
		const series = d3
			.stack()
			.keys([].concat(data.negatives.slice().reverse(), data.positives))
			.value(([, value], category) => signs.get(category) * (value.get(category) || 0))
			.offset(d3.stackOffsetDiverging)(
			d3.rollup(
				data,
				(data) =>
					d3.rollup(
						data,
						([d]) => d.value,
						(d) => d.category
					),
				(d) => d.name
			)
		);

		// Construct the scales.
		const x = d3
			.scaleLinear()
			.domain(d3.extent(series.flat(2)))
			.rangeRound([marginLeft, width - marginRight]);

		const y = d3
			.scaleBand()
			.domain(bias.map(([name]) => name))
			.rangeRound([marginTop, height - marginBottom])
			.padding(2 / 5);

		const color = d3
			.scaleOrdinal()
			.domain([].concat(data.negatives, data.positives))
			.range(d3.schemePRGn[data.negatives.length + data.positives.length]);

		// A function to format a percentage, used both on the axis and in the tooltips.
		const formatValue = (
			(format) => (x) =>
				format(Math.abs(x))
		)(d3.format('.0%'));

		d3.select('#bar2').attr('style', `margin-top: 200px; margin-bottom: 100px; max-width: 88%`);

		// Create the SVG container.
		const svg = d3
			.select('#bar2')
			.append('svg')
			.attr('viewBox', [0, 0, width, height])
			.attr('style', 'max-width: 100%; height: auto; font: 10px sans-serif;')
			.attr('preserveAspectRatio', 'xMinYMin meet');

		// Append a rect for each value, with a tooltip.
		svg
			.append('g')
			.selectAll('g')
			.data(series)
			.join('g')
			.attr('fill', (d) => color(d.key))
			.selectAll('rect')
			.data((d) => d.map((v) => Object.assign(v, { key: d.key })))
			.join('rect')
			.attr('x', (d) => x(d[0]))
			.attr('y', ({ data: [name] }) => y(name))
			.attr('width', (d) => x(d[1]) - x(d[0]))
			.attr('height', y.bandwidth())
			.append('title')
			.text(
				({ key, data: [name, value] }) => `${name}
  ${formatValue(value.get(key))} ${key}`
			);

		// Create the axes.
		var axis = svg
			.append('g')
			.attr('transform', `translate(0,${marginTop})`)
			.call(
				d3
					.axisTop(x)
					.ticks(width / 80)
					.tickFormat(formatValue)
					.tickSizeOuter(0)
			);
		// .call((g) => g.select('.domain').remove());
		axis.selectAll('line').style('stroke', 'white');
		axis
			.call((g) =>
				g
					.append('text')
					.attr('x', x(0) + 20)
					.attr('y', -24)
					.attr('fill', 'white')
					.attr('text-anchor', 'start')
					.text(data.positive)
			)
			.style('stroke', 'white')
			.style('stroke-width', 0.7);

		axis
			.call((g) =>
				g
					.append('text')
					.attr('x', x(0) - 20)
					.attr('y', -24)
					.attr('fill', 'white')
					.attr('text-anchor', 'end')
					.text(data.negative)
			)
			.style('stroke', 'white')
			.style('stroke-width', 0.7);

			const formatTextValue = (
				(format) => (x) =>
					format(Math.abs(x))
		)(d3.format('.0%'));
		
		var axis2 = svg.append('g').call(d3.axisLeft(y).tickSizeOuter(0));

		axis2
			.call((g) =>
				g
					.selectAll('.tick')
					.data(bias)
					.attr('transform', ([name, min]) => `translate(${x(min)},${y(name) + y.bandwidth() / 2})`)
			)
			.call((g) => g.select('.domain').attr('transform', `translate(${x(0)},0)`))
			.style('stroke', 'white')
			.style('stroke-width', 0.7);

		axis2.selectAll('line').style('stroke', 'white');
		axis2
			.call((g) => g.selectAll('text').remove())
		
		let tickName = d3.group(data, (d) => d.name);
		
		axis2.call((g) =>
			g.selectAll('.tick')
				.data(tickName)
				.append('svg:foreignObject')
				.attr('width', 270)
				.attr('height', 125)
				.attr('x', -290)
				.attr('y', -17)
				.attr("text-anchor", "left")
				.style("alignment-baseline", "middle")
				.style('text-align', 'right')
				.append("xhtml:div")
				.style('color', 'white')
				.style('font-weight', '800')
				.html(d => `${d[0]}`)
		);

		d3.selectAll('.domain').attr('stroke', 'white');

		// Add a legend.
		const legend = svg
			.append('g')
			.selectAll('g')
			.data([].concat(data.negatives, data.positives).reverse())
			.join('g')
			.attr('transform', (d, i) => `translate(0,${(i * 20)+80})`);

		legend
			.append('rect')
			.attr('x', width - 19)
			.attr('width', 19)
			.attr('height', 19)
			.attr('fill', color);

		legend
			.append('text')
			.attr('x', width - 24)
			.attr('y', 9.5)
			.attr('dy', '0.35em')
            .attr('text-anchor', 'end')
            .attr('fill', 'white')
			.text((d) => d);

		legend.append('title').text((d) => d);

		// Return the color scale as a property of the node, for the legend.
		return Object.assign(svg.node(), { scales: { color } });
	});
