import React from 'react'
import Link from '@/i18n/client'

export const metadata = { title: 'Camera Intelligence' }

export default function CameraPage() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="space-y-3 rounded-2xl bg-neutral-50 p-5 dark:bg-neutral-900">
        <h2 className="text-[14px] font-semibold">CA7 Camera Agent (preview)</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Camera Intelligence runs on your own computer, next to your cameras. The agent reads a snapshot from each camera on your network, measures
          movement and sends the result to your CA7 account as data. You then see it in Data Intelligence, ask CA7 Chat about it and use it in Automation.
        </p>
        <ol className="list-decimal space-y-1.5 ps-5 text-sm text-neutral-600 dark:text-neutral-300">
          <li>Add a data source of type <strong>Camera</strong> in <Link href="/dashboard/connect?type=camera" className="underline">Data Connect</Link> and copy its token.</li>
          <li>Install the agent: <code className="rounded bg-neutral-200 px-1 dark:bg-neutral-800">desktop/ca7-camera-agent</code> in the project (needs Node 20).</li>
          <li>Run it with your camera snapshot address and the token (see its README).</li>
        </ol>
      </section>
      <section className="space-y-2 rounded-2xl bg-neutral-50 p-5 dark:bg-neutral-900">
        <h2 className="text-[14px] font-semibold">What it does today</h2>
        <ul className="list-disc space-y-1 ps-5 text-sm text-neutral-600 dark:text-neutral-300">
          <li>Movement score per camera and per interval, sent as records (<code>camera</code>, <code>motion</code>).</li>
          <li>Works with any camera that gives a JPEG snapshot over HTTP.</li>
        </ul>
        <h2 className="pt-2 text-[14px] font-semibold">Not available yet</h2>
        <ul className="list-disc space-y-1 ps-5 text-sm text-neutral-600 dark:text-neutral-300">
          <li>Recognising people, vehicles or objects.</li>
          <li>RTSP video streams, a graphical app and installers for Windows and macOS.</li>
        </ul>
      </section>
    </div>
  )
}
