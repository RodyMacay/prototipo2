import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import useResizeObserver from '../../hooks/useResizeObserver';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface DoughnutChartProps {
  data: DataPoint[];
  innerRadius?: number;
  showLabels?: boolean;
  showLegend?: boolean;
}

export const DoughnutChart: React.FC<DoughnutChartProps> = ({
  data,
  innerRadius = 60,
  showLabels = true,
  showLegend = true
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const dimensions = useResizeObserver(wrapperRef);

  useEffect(() => {
    if (!svgRef.current || !data.length || !dimensions) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const radius = Math.min(width, height) / 2;
    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const color = d3.scaleOrdinal()
      .domain(data.map(d => d.label))
      .range(data.map(d => d.color || d3.schemeCategory10[Math.floor(Math.random() * 10)]));

    const pie = d3.pie<DataPoint>()
      .value(d => d.value)
      .sort(null);

    const arc = d3.arc<d3.PieArcDatum<DataPoint>>()
      .innerRadius(innerRadius)
      .outerRadius(radius - 10);

    const arcs = g.selectAll('.arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc');

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.label) as string)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Labels
    if (showLabels) {
      arcs.append('text')
        .attr('transform', d => `translate(${arc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('fill', '#fff')
        .attr('font-weight', 'bold')
        .text(d => `${((d.data.value / d3.sum(data, d => d.value)) * 100).toFixed(0)}%`);
    }

    // Legend
    if (showLegend) {
      const legend = svg.append('g')
        .attr('transform', `translate(${width - 120}, 20)`);

      const legendItems = legend.selectAll('.legend-item')
        .data(data)
        .enter()
        .append('g')
        .attr('class', 'legend-item')
        .attr('transform', (d, i) => `translate(0, ${i * 20})`);

      legendItems.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', d => color(d.label) as string);

      legendItems.append('text')
        .attr('x', 18)
        .attr('y', 9)
        .attr('font-size', '12px')
        .attr('fill', '#666')
        .text(d => d.label);
    }

  }, [data, dimensions, innerRadius, showLabels, showLegend]);

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '100%' }} className="doughnut-chart">
      <svg ref={svgRef}></svg>
    </div>
  );
};
