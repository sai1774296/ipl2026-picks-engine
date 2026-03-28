"use client"

import { TEAMS } from "@/data/schedule"

const teamCodes = Object.keys(TEAMS)

export function IplBanner({
  subtitle,
  children,
}: {
  subtitle?: string
  children?: React.ReactNode
}) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-pitch-dark via-pitch to-pitch-light border border-border">
      {/* Team color strip at top */}
      <div className="flex h-1.5">
        {teamCodes.map((code) => (
          <div
            key={code}
            className="flex-1"
            style={{ backgroundColor: TEAMS[code].primary }}
          />
        ))}
      </div>

      <div className="relative px-5 py-5 md:px-8 md:py-6">
        {/* Decorative team dots */}
        <div className="absolute top-3 right-4 flex gap-1.5 opacity-30">
          {teamCodes.slice(0, 5).map((code) => (
            <div
              key={code}
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: TEAMS[code].primary }}
            />
          ))}
        </div>
        <div className="absolute bottom-3 right-4 flex gap-1.5 opacity-30">
          {teamCodes.slice(5).map((code) => (
            <div
              key={code}
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: TEAMS[code].primary }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl md:text-4xl font-extrabold text-gold tracking-tight">
                IPL 2026
              </span>
              <span className="text-sm font-medium text-gold/60">TATA</span>
            </div>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          {children}
        </div>
      </div>

      {/* Bottom team color strip */}
      <div className="flex h-0.5 opacity-50">
        {teamCodes.reverse().map((code) => (
          <div
            key={code}
            className="flex-1"
            style={{ backgroundColor: TEAMS[code].secondary }}
          />
        ))}
      </div>
    </div>
  )
}
