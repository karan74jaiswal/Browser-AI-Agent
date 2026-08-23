I want to let a workflow field pull in another node's output by writing a
placeholder like {{ someNodeId.title }} or {{ someNodeId.items[0].name }} inside it.

To make that work I need a small pure helper that takes one field's text plus a
collection of every node's output from this run — keyed by node id — and returns
the text with each placeholder swapped for the value it points at.

If a placeholder resolves to nothing, replace it with an empty string; if it
resolves to an object, drop in the JSON.

It has to resolve nested paths, so lean on whatever small get-by-path utility is
cleanest.

Put it with the workflow feature's helpers and call it `interpolate`.
