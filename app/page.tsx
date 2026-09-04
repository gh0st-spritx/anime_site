import { getPageData, type Act } from '../lib/db/queries.ts';
import { isIntensity } from '../lib/motion.ts';
import MotionProvider from '../components/motion/MotionContext.tsx';
import SmoothScroll from '../components/motion/SmoothScroll.tsx';
import Scene from '../components/motion/Scene.tsx';
import AtmosphereCanvas from '../components/motion/AtmosphereCanvas.tsx';
import ActRoom from '../components/scenes/ActRoom.tsx';
import ActPull from '../components/scenes/ActPull.tsx';
import ActField from '../components/scenes/ActField.tsx';
import ActSignal from '../components/scenes/ActSignal.tsx';
import ActClassroom from '../components/scenes/ActClassroom.tsx';
import ActTerminal from '../components/scenes/ActTerminal.tsx';
import ActBadges from '../components/scenes/ActBadges.tsx';
import ActWorkshop from '../components/scenes/ActWorkshop.tsx';
import ActArcade from '../components/scenes/ActArcade.tsx';
import ActReturn from '../components/scenes/ActReturn.tsx';

// The page reads SQLite on every request. Reads are sub-millisecond, and it
// keeps the admin panel's changes instant without cache plumbing.
// ponytail: revisit only if this ever sees real traffic.
export const dynamic = 'force-dynamic';

export default async function Home() {
  const data = await getPageData();
  const { profile, settings } = data;

  if (settings.maintenanceMode) {
    return (
      <main className="maintenance">
        <h1>{profile.name}</h1>
        <p>This site is being worked on. Back shortly.</p>
      </main>
    );
  }

  const siteIntensity = isIntensity(settings.motionIntensity)
    ? settings.motionIntensity
    : 'full';

  /** Each act's content. Scene wraps it to attach the choreography. */
  function renderAct(act: Act) {
    switch (act.key) {
      case 'room':
        return (
          <ActRoom
            act={act}
            name={profile.name}
            title={profile.title}
            birthdate={profile.birthdate}
          />
        );
      case 'pull':
        return <ActPull act={act} />;
      case 'field':
        return <ActField act={act} />;
      case 'signal':
        return <ActSignal act={act} />;
      case 'classroom':
        return <ActClassroom act={act} education={data.education} />;
      case 'terminal':
        return <ActTerminal act={act} skills={data.skills} />;
      case 'badges':
        return <ActBadges act={act} certifications={data.certifications} />;
      case 'workshop':
        return (
          <ActWorkshop
            act={act}
            projects={data.projects}
            learning={data.learning}
          />
        );
      case 'arcade':
        return <ActArcade act={act} games={data.games} />;
      case 'return':
        return <ActReturn act={act} links={data.links} name={profile.name} />;
      default:
        // An act added to the database with no component yet.
        return null;
    }
  }

  return (
    <MotionProvider siteIntensity={siteIntensity}>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <SmoothScroll />
      <AtmosphereCanvas />

      <main id="main">
        {data.acts.map((act) => {
          const content = renderAct(act);
          if (!content) return null;
          return (
            <Scene key={act.id} actKey={act.key}>
              {content}
            </Scene>
          );
        })}
      </main>
    </MotionProvider>
  );
}
