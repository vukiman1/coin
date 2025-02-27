"use client"

import * as React from "react"
import { createContext, useContext } from "react"

import { cn } from "@/lib/utils"

type ChartConfig = Record<
  string,
  {
    label: string
    color?: string
  }
>

type ChartContextValue = {
  config: ChartConfig
}

const ChartContext = createContext<ChartContextValue | null>(null)

function useChartContext() {
  const context = useContext(ChartContext)

  if (!context) {
    throw new Error("useChartContext must be used within a ChartProvider")
  }

  return context
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    config: ChartConfig
  }
>(({ children, config, className, ...props }, ref) => {
  const style = React.useMemo(() => {
    return Object.entries(config).reduce(
      (acc, [key, value]) => {
        if (value.color) {
          acc[`--color-${key}`] = value.color
        }
        return acc
      },
      {} as Record<string, string>,
    )
  }, [config])

  return (
    <ChartContext.Provider value={{ config }}>
      <div ref={ref} className={cn("w-full", className)} style={style} {...props}>
        {children}
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "ChartContainer"

interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    name: string
    dataKey: string
  }>
  label?: string
  formatter?: (value: number) => string
  labelFormatter?: (label: string) => string
  hideLabel?: boolean
  indicator?: "dot" | "line"
}

const ChartTooltipContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & ChartTooltipProps>(
  (
    { active, payload, label, formatter, labelFormatter, hideLabel = false, indicator = "dot", className, ...props },
    ref,
  ) => {
    const { config } = useChartContext()

    if (!active || !payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-950 shadow-sm dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50",
          className,
        )}
        {...props}
      >
        {!hideLabel && (
          <p className="mb-2 text-sm font-medium">{labelFormatter ? labelFormatter(label as string) : label}</p>
        )}
        <div className="flex flex-col gap-1">
          {payload.map((item) => {
            const dataKey = item.dataKey as string
            const itemConfig = config[dataKey]
            const itemColor = itemConfig?.color || "currentColor"
            const itemLabel = itemConfig?.label || dataKey
            const itemValue = formatter ? formatter(item.value) : item.value.toString()

            return (
              <div key={dataKey} className="flex items-center gap-2">
                {indicator === "dot" && <div className="h-2 w-2 rounded-full" style={{ backgroundColor: itemColor }} />}
                {indicator === "line" && (
                  <div className="h-1 w-4 rounded-full" style={{ backgroundColor: itemColor }} />
                )}
                <p className="text-sm font-medium">{itemLabel}</p>
                <p className="ml-auto text-sm font-medium">{itemValue}</p>
              </div>
            )
          })}
        </div>
      </div>
    )
  },
)
ChartTooltipContent.displayName = "ChartTooltipContent"

const ChartTooltip = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    content: React.ReactNode
    cursor?: boolean | React.ReactNode
    offset?: number
    defaultIndex?: number
  }
>(({ content, ...props }, ref) => {
  return <div ref={ref} {...props} />
})
ChartTooltip.displayName = "ChartTooltip"

export { ChartContainer, ChartTooltip, ChartTooltipContent }

