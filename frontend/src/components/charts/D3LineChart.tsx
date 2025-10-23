import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import useResizeObserver from '../../hooks/useResizeObserver';

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
  }[];
}

interface D3LineChartProps {
  data: ChartData;
}

export const D3LineChart: React.FC<D3LineChartProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const dimensions = useResizeObserver(wrapperRef);

  useEffect(() => {
    if (!svgRef.current || !data || !dimensions) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const { width, height } = dimensions;
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };

    const xScale = d3
      .scalePoint()
      .domain(data.labels)
      .range([margin.left, width - margin.right]);

    const yScale = d3
      .scaleLinear()
      .domain([0, 100]) // Assuming a max of 100 from the original chart
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

    // Draw the lines
    const line = d3
      .line<number>()
      .x((_d, i) => xScale(data.labels[i])!)
      .y(d => yScale(d));

    data.datasets.forEach(dataset => {
      svg
        .append('path')
        .datum(dataset.data)
        .attr('fill', 'none')
        .attr('stroke', dataset.borderColor)
        .attr('stroke-width', 2)
        .attr('d', line);
    });

  }, [data, dimensions]);

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} width={dimensions?.width} height={dimensions?.height}></svg>
    </div>
  );
};
