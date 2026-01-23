#!/usr/bin/env node
// Lightweight Slack notifier to post rollback requests. Requires SLACK_BOT_TOKEN and SLACK_CHANNEL env vars.
import { WebClient } from '@slack/web-api'
import fs from 'fs'
import path from 'path'

const token = process.env.SLACK_BOT_TOKEN
const channel = process.env.SLACK_CHANNEL
if (!token || !channel) { console.error('Set SLACK_BOT_TOKEN and SLACK_CHANNEL'); process.exit(1) }
const client = new WebClient(token)

export async function postRequest({ token: reqToken, requestedBy, reason }) {
  const blocks = [
    { type: 'section', text: { type: 'mrkdwn', text: `*Rollback request*\n*Token:* ${reqToken}\n*By:* ${requestedBy}\n*Reason:* ${reason || ''}` } },
    { type: 'actions', elements: [
      { type: 'button', text: { type: 'plain_text', text: 'Approve' }, value: reqToken, action_id: 'approve' },
      { type: 'button', text: { type: 'plain_text', text: 'Reject' }, value: reqToken, action_id: 'reject' }
    ] }
  ]
  const res = await client.chat.postMessage({ channel, blocks, text: `Rollback request ${reqToken}` })
  return res
}

if (require.main === module) {
  const [,, reqToken, by, reason] = process.argv
  postRequest({ token: reqToken || 'TBD', requestedBy: by || 'cli', reason }).then(r=>console.log('posted', r.ts)).catch(e=>console.error(e))
}
