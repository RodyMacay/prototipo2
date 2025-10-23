import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import useResizeObserver from '../../hooks/useResizeObserver';

interface ScatterDataPoint {
  x: number;
  y: number;
}

interface ChartData {
  datasets: {
    label: string;
    data: ScatterDataPoint[];
    backgroundColor: string;
  }[];
}

interface D3ScatterChartProps {
  data: ChartData;
}

export const D3ScatterChart: React.FC<D3ScatterChartProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const dimensions = useResizeObserver(wrapperRef);

  useEffect(() => {
    if (!svgRef.current || !data || !dimensions) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };

    const allXData = data.datasets.flatMap(d => d.data.map(p => p.x));
    const allYData = data.datasets.flatMap(d => d.data.map(p => p.y));

    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(allXData) as [number, number])
      .range([margin.left, width - margin.right]);

    const yScale = d3
      .scaleLinear()
      .domain(d3.extent(allYData) as [number, number])
      .range([height - margin.bottom, margin.top]);

    // Add X axis
    svg
      .append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale));

    // Add Y axis
    svg
      .append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale));

    // Draw the points
    data.datasets.forEach(dataset => {
      svg
        .append('g')
        .selectAll('circle')
        .data(dataset.data)
        .join('circle')
        .attr('cx', d => xScale(d.x))
        .attr('cy', d => yScale(d.y))
        .attr('r', 5)
        .attr('fill', dataset.backgroundColor);
    });

  }, [data, dimensions]);

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} width={dimensions?.width} height={dimensions?.height}></svg>
    </div>
  );
};
