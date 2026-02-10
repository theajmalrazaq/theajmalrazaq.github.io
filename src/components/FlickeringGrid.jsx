import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"

export const FlickeringGrid = React.forwardRef(
  (
    {
      squareSize = 2,
      gridGap = 6,
      flickerChance = 0.3,
      color = "rgb(167, 139, 250)",
      width,
      height,
      className = "",
      maxOpacity = 0.5,
      ...props
    },
    ref
  ) => {
    const canvasRef = useRef(null)
    const containerRef = useRef(null)
    const [isInView, setIsInView] = useState(false)
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
    const [resolvedColor, setResolvedColor] = useState(color)

    const resolveColor = useCallback((colorValue) => {
      if (typeof window === "undefined") {
        return "rgb(167, 139, 250)"
      }

      const colorToResolve = colorValue || "rgb(167, 139, 250)"

      if (colorToResolve.startsWith("var(")) {
        const tempEl = document.createElement("div")
        tempEl.style.color = colorToResolve
        tempEl.style.position = "absolute"
        tempEl.style.visibility = "hidden"
        document.body.appendChild(tempEl)
        const computedColor = window.getComputedStyle(tempEl).color
        document.body.removeChild(tempEl)
        return computedColor || "rgb(167, 139, 250)"
      }

      return colorToResolve
    }, [])

    useEffect(() => {
      const updateColor = () => {
        const resolved = resolveColor(color)
        setResolvedColor(resolved)
      }

      updateColor()

      const observer = new MutationObserver(() => {
        updateColor()
      })

      if (typeof window !== "undefined") {
        observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["class"],
        })
      }

      return () => {
        observer.disconnect()
      }
    }, [color, resolveColor])

    const memoizedColor = useMemo(() => {
      const toRGBA = (colorValue) => {
        if (typeof window === "undefined") {
          return `rgba(167, 139, 250,`
        }
        const canvas = document.createElement("canvas")
        canvas.width = canvas.height = 1
        const ctx = canvas.getContext("2d")
        if (!ctx) return "rgba(167, 139, 250,"
        ctx.fillStyle = colorValue
        ctx.fillRect(0, 0, 1, 1)
        const imageData = ctx.getImageData(0, 0, 1, 1).data
        const r = imageData[0]
        const g = imageData[1]
        const b = imageData[2]
        return `rgba(${r}, ${g}, ${b},`
      }
      return toRGBA(resolvedColor)
    }, [resolvedColor])

    const setupCanvas = useCallback(
      (canvas, width, height) => {
        const dpr = window.devicePixelRatio || 1
        canvas.width = width * dpr
        canvas.height = height * dpr
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
        const cols = Math.floor(width / (squareSize + gridGap))
        const rows = Math.floor(height / (squareSize + gridGap))

        const squares = new Float32Array(cols * rows)
        for (let i = 0; i < squares.length; i++) {
          squares[i] = Math.random() * maxOpacity
        }

        return { cols, rows, squares, dpr }
      },
      [squareSize, gridGap, maxOpacity]
    )

    const updateSquares = useCallback(
      (squares, deltaTime) => {
        for (let i = 0; i < squares.length; i++) {
          if (Math.random() < flickerChance * deltaTime) {
            squares[i] = Math.random() * maxOpacity
          }
        }
      },
      [flickerChance, maxOpacity]
    )

    const drawGrid = useCallback(
      (ctx, width, height, cols, rows, squares, dpr) => {
        ctx.clearRect(0, 0, width, height)
        ctx.fillStyle = "transparent"
        ctx.fillRect(0, 0, width, height)

        for (let i = 0; i < cols; i++) {
          for (let j = 0; j < rows; j++) {
            const opacity = squares[i * rows + j]
            ctx.fillStyle = `${memoizedColor}${opacity})`
            ctx.fillRect(
              i * (squareSize + gridGap) * dpr,
              j * (squareSize + gridGap) * dpr,
              squareSize * dpr,
              squareSize * dpr
            )
          }
        }
      },
      [memoizedColor, squareSize, gridGap]
    )

    useEffect(() => {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      let animationFrameId
      let gridParams

      const updateCanvasSize = () => {
        const newWidth = width || container.clientWidth
        const newHeight = height || container.clientHeight
        setCanvasSize({ width: newWidth, height: newHeight })
        gridParams = setupCanvas(canvas, newWidth, newHeight)
      }

      updateCanvasSize()

      let lastTime = 0
      const animate = (time) => {
        if (!isInView) return

        const deltaTime = (time - lastTime) / 1000
        lastTime = time

        updateSquares(gridParams.squares, deltaTime)
        drawGrid(
          ctx,
          canvas.width,
          canvas.height,
          gridParams.cols,
          gridParams.rows,
          gridParams.squares,
          gridParams.dpr
        )
        animationFrameId = requestAnimationFrame(animate)
      }

      const resizeObserver = new ResizeObserver(() => {
        updateCanvasSize()
      })

      resizeObserver.observe(container)

      const intersectionObserver = new IntersectionObserver(
        ([entry]) => {
          setIsInView(entry.isIntersecting)
        },
        { threshold: 0 }
      )

      intersectionObserver.observe(canvas)

      if (isInView) {
        animationFrameId = requestAnimationFrame(animate)
      }

      return () => {
        cancelAnimationFrame(animationFrameId)
        resizeObserver.disconnect()
        intersectionObserver.disconnect()
      }
    }, [setupCanvas, updateSquares, drawGrid, width, height, isInView])

    return (
      <div
        ref={containerRef}
        className={`h-full w-full ${className}`}
        {...props}
      >
        <canvas
          ref={canvasRef}
          className="pointer-events-none"
          style={{
            width: canvasSize.width,
            height: canvasSize.height,
          }}
        />
      </div>
    )
  }
)

FlickeringGrid.displayName = "FlickeringGrid"

export default FlickeringGrid
