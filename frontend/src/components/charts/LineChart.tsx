import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import useResizeObserver from '../../hooks/useResizeObserver';

interface DataPoint {
  x: number | string;
  y: number;
}

interface LineChartProps {
  data: DataPoint[];
  color?: string;
  showGrid?: boolean;
  xLabel?: string;
  yLabel?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  color = '#3B82F6',
  showGrid = true,
  xLabel,
  yLabel
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const dimensions = useResizeObserver(wrapperRef);

  useEffect(() => {
    if (!svgRef.current || !data.length || !dimensions) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(data, d => typeof d.x === 'string' ? parseFloat(d.x) : d.x) as [number, number])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.y) as number])
      .nice()
      .range([innerHeight, 0]);

    // Grid lines
    if (showGrid) {
      g.append('g')
        .attr('class', 'grid')
        .attr('opacity', 0.1)
        .call(d3.axisLeft(yScale)
          .tickSize(-innerWidth)
          .tickFormat(() => ''));

      g.append('g')
        .attr('class', 'grid')
        .attr('transform', `translate(0,${innerHeight})`)
        .attr('opacity', 0.1)
        .call(d3.axisBottom(xScale)
          .tickSize(-innerHeight)
          .tickFormat(() => ''));
    }

    // Line
    const line = d3.line<DataPoint>()
      .x(d => xScale(typeof d.x === 'string' ? parseFloat(d.x) : d.x))
      .y(d => yScale(d.y))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2)
      .attr('d', line);

    // Area fill
    const area = d3.area<DataPoint>()
      .x(d => xScale(typeof d.x === 'string' ? parseFloat(d.x) : d.x))
      .y0(innerHeight)
      .y1(d => yScale(d.y))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', color)
      .attr('fill-opacity', 0.1)
      .attr('d', area);

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(5));

    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5));

    // Labels
    if (xLabel) {
      svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('x', width / 2)
        .attr('y', height - 5)
        .attr('fill', '#666')
        .style('font-size', '12px')
        .text(xLabel);
    }

    if (yLabel) {
      svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', 15)
        .attr('fill', '#666')
        .style('font-size', '12px')
        .text(yLabel);
    }

  }, [data, dimensions, color, showGrid, xLabel, yLabel]);

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '100%' }} className="line-chart">
      <svg ref={svgRef}></svg>
    </div>
  );
};
