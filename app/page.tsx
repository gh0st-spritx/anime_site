import { getPageData } from '../lib/db/queries.ts';
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

  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>

      <main id="main">
        {data.acts.map((act) => {
          switch (act.key) {
            case 'room':
              return (
                <ActRoom
                  key={act.id}
                  act={act}
                  name={profile.name}
                  title={profile.title}
                  birthdate={profile.birthdate}
                />
              );
            case 'pull':
              return <ActPull key={act.id} act={act} />;
            case 'field':
              return <ActField key={act.id} act={act} />;
            case 'signal':
              return <ActSignal key={act.id} act={act} />;
            case 'classroom':
              return (
                <ActClassroom key={act.id} act={act} education={data.education} />
              );
            case 'terminal':
              return <ActTerminal key={act.id} act={act} skills={data.skills} />;
            case 'badges':
              return (
                <ActBadges
                  key={act.id}
                  act={act}
                  certifications={data.certifications}
                />
              );
            case 'workshop':
              return (
                <ActWorkshop
                  key={act.id}
                  act={act}
                  projects={data.projects}
                  learning={data.learning}
                />
              );
            case 'arcade':
              return <ActArcade key={act.id} act={act} games={data.games} />;
            case 'return':
              return (
                <ActReturn
                  key={act.id}
                  act={act}
                  links={data.links}
                  name={profile.name}
                />
              );
            default:
              // An act added to the database with no component yet.
              return null;
          }
        })}
      </main>
    </>
  );
}
