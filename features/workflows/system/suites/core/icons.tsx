import * as React from "react"

export function JsCodeIcon({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return React.createElement(
    "svg",
    {
      role: "img",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className,
      xmlns: "http://www.w3.org/2000/svg",
      ...props,
    },
    // Common code block / terminal window container
    React.createElement("rect", {
      width: "20",
      height: "18",
      x: "2",
      y: "3",
      rx: "2.5",
      strokeWidth: "1.8",
    }),
    React.createElement("line", {
      x1: "2",
      y1: "8.5",
      x2: "22",
      y2: "8.5",
      strokeWidth: "1.2",
    }),
    React.createElement("circle", {
      cx: "5.5",
      cy: "5.75",
      r: "0.8",
      fill: "currentColor",
      stroke: "none",
    }),
    React.createElement("circle", {
      cx: "8.5",
      cy: "5.75",
      r: "0.8",
      fill: "currentColor",
      stroke: "none",
    }),
    // JS Lettering
    React.createElement("path", {
      d: "M7.5 16.2c.3.5.7.8 1.4.8.8 0 1.3-.4 1.3-1.1v-3.7h-1.2",
      strokeWidth: "1.8",
    }),
    React.createElement("path", {
      d: "M13.2 16c.4.6 1 .9 1.7.9.9 0 1.5-.5 1.5-1.1 0-.6-.5-.9-1.4-1.2l-.5-.2c-1.1-.3-1.7-.7-1.7-1.6 0-1 .8-1.7 1.9-1.7.9 0 1.5.3 1.9.9",
      strokeWidth: "1.8",
    })
  )
}

export function PythonCodeIcon({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return React.createElement(
    "svg",
    {
      role: "img",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className,
      xmlns: "http://www.w3.org/2000/svg",
      ...props,
    },
    // Common code block / terminal window container
    React.createElement("rect", {
      width: "20",
      height: "18",
      x: "2",
      y: "3",
      rx: "2.5",
      strokeWidth: "1.8",
    }),
    React.createElement("line", {
      x1: "2",
      y1: "8.5",
      x2: "22",
      y2: "8.5",
      strokeWidth: "1.2",
    }),
    React.createElement("circle", {
      cx: "5.5",
      cy: "5.75",
      r: "0.8",
      fill: "currentColor",
      stroke: "none",
    }),
    React.createElement("circle", {
      cx: "8.5",
      cy: "5.75",
      r: "0.8",
      fill: "currentColor",
      stroke: "none",
    }),
    // Python dual-snake glyph
    React.createElement("path", {
      d: "M12 11.2h2a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-2a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-1.5a1 1 0 0 1 1-1H11a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1Z",
      strokeWidth: "1.5",
    }),
    React.createElement("circle", {
      cx: "9.5",
      cy: "12.5",
      r: "0.6",
      fill: "currentColor",
      stroke: "none",
    }),
    React.createElement("circle", {
      cx: "14.5",
      cy: "14.5",
      r: "0.6",
      fill: "currentColor",
      stroke: "none",
    })
  )
}
