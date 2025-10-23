import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import useResizeObserver from '../../hooks/useResizeObserver';

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
  }[];
}

interface D3BarChartProps {
  data: ChartData;
}

export const D3BarChart: React.FC<D3BarChartProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const dimensions = useResizeObserver(wrapperRef);

  useEffect(() => {
    if (!svgRef.current || !data || !dimensions) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };

    const x0 = d3
      .scaleBand()
      .domain(data.labels)
      .rangeRound([margin.left, width - margin.right])
      .paddingInner(0.1);

    const x1 = d3
      .scaleBand()
      .domain(data.datasets.map(d => d.label))
      .rangeRound([0, x0.bandwidth()])
      .padding(0.05);

    const y = d3
      .scaleLinear()
      .domain([0, 100])
      .range([height - margin.bottom, margin.top]);

    svg
      .append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x0));

    svg
      .append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

    const group = svg
      .append('g')
      .selectAll('g')
      .data(data.labels)
      .join('g')
      .attr('transform', d => `translate(${x0(d!)},0)`);

    data.datasets.forEach((dataset) => {
      group
        .selectAll(`rect.bar-${dataset.label}`)
        .data(d => [dataset.data[data.labels.indexOf(d)]])
        .join('rect')
        .attr('class', `bar-${dataset.label}`)
        .attr('x', () => x1(dataset.label)!)
        .attr('y', d => y(d))
        .attr('width', x1.bandwidth())
        .attr('height', d => height - margin.bottom - y(d))
        .attr('fill', dataset.backgroundColor);
    });

  }, [data, dimensions]);

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} width={dimensions?.width} height={dimensions?.height}></svg>
    </div>
  );
};
