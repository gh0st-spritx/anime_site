import type { Act } from '../../lib/db/queries.ts';
import Plate from '../site/Plate.tsx';
import ActShell from '../site/ActShell.tsx';

/**
 * Act 3 — The Signal. The centrepiece and the turn.
 *
 * The terminal below is atmosphere, not instruction: it shows a machine coming
 * up and a link going live, never a method. See spec §2.
 */
const BOOT = [
  '$ sudo ./install-linux.sh',
  '  base system .................. ok',
  '  wireless interface ........... ok',
  '',
  '$ iwlist wlan0 scan | grep ESSID',
  '    ESSID:"__________"   -71 dBm',
  '',
  '  one network. not mine.',
  '  three weeks of reading.',
  '',
  'wlan0: link becomes ready',
  '$ ping -c1 1.1.1.1',
  '64 bytes from 1.1.1.1: time=41.2 ms',
  '',
  '  it worked.',
]

export default function ActSignal({ act }: { act: Act }) {
  return (
    <ActShell act={act} grade="signal" plate={<Plate act={act} />}>
      <div className="terminal" role="img" aria-label="A terminal showing a laptop being set up and connecting to a network for the first time">
        <div className="terminal-bar" aria-hidden="true">
          <span /><span /><span />
        </div>
        <pre className="terminal-body">
          {BOOT.map((line, i) => (
            <span key={i} className="terminal-line" data-dim={line.startsWith('  ') ? 'true' : undefined}>
              {line || ' '}
            </span>
          ))}
        </pre>
      </div>

      <p className="pull-quote pull-quote--tight">
        The interesting part was never getting in. It was that the wall had a seam.
      </p>
    </ActShell>
  );
}
