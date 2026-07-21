"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import { BarChart, LineChart } from "echarts/charts";
import { GridComponent, LegendComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([BarChart, CanvasRenderer, GridComponent, LegendComponent, LineChart, TooltipComponent]);

export type OperationsTrendPoint = {
  label: string;
  deliveredMeals: number;
  dispatchedHandoffs: number;
};

export function OperationsTrendChart({ data }: { data: OperationsTrendPoint[] }) {
  const chartElement = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartElement.current) return;

    const chart = echarts.init(chartElement.current, undefined, { renderer: "canvas" });
    chart.setOption({
      animationDuration: 550,
      aria: {
        enabled: true,
        description: "A seven-day operations chart showing delivered meals and dispatched handoffs.",
      },
      color: ["#4e8060", "#d77832"],
      grid: { top: 44, right: 16, bottom: 28, left: 36 },
      legend: { top: 2, left: 0, itemWidth: 10, itemHeight: 10, textStyle: { color: "#52675a", fontSize: 12, fontWeight: 600 } },
      tooltip: {
        trigger: "axis",
        backgroundColor: "#183d2a",
        borderWidth: 0,
        textStyle: { color: "#ffffff" },
        padding: [10, 12],
      },
      xAxis: {
        type: "category",
        data: data.map((point) => point.label),
        axisLine: { lineStyle: { color: "#dce6d9" } },
        axisTick: { show: false },
        axisLabel: { color: "#68776d", fontSize: 11, margin: 12 },
      },
      yAxis: [
        { type: "value", minInterval: 1, splitLine: { lineStyle: { color: "#edf0ea" } }, axisLabel: { color: "#8a968d", fontSize: 11 }, axisLine: { show: false }, axisTick: { show: false } },
        { type: "value", minInterval: 1, splitLine: { show: false }, axisLabel: { show: false }, axisLine: { show: false }, axisTick: { show: false } },
      ],
      series: [
        {
          name: "Meals delivered",
          type: "bar",
          data: data.map((point) => point.deliveredMeals),
          barMaxWidth: 28,
          itemStyle: { borderRadius: [7, 7, 2, 2] },
        },
        {
          name: "Handoffs dispatched",
          type: "line",
          yAxisIndex: 1,
          data: data.map((point) => point.dispatchedHandoffs),
          smooth: true,
          symbol: "circle",
          symbolSize: 7,
          lineStyle: { width: 3 },
          itemStyle: { borderColor: "#ffffff", borderWidth: 2 },
        },
      ],
    });

    const resizeObserver = new ResizeObserver(() => chart.resize());
    resizeObserver.observe(chartElement.current);
    return () => {
      resizeObserver.disconnect();
      chart.dispose();
    };
  }, [data]);

  return <div ref={chartElement} role="img" aria-label="Seven-day delivery and dispatch trend" className="h-[270px] w-full" />;
}
