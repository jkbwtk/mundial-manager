import { createMemo, createSignal, For, Show } from 'solid-js';
import { Button } from '#components/Button';
import { DeltaDisplay } from '#components/DeltaDisplay';
import { Modal } from '#components/Modal';
import { PlayerLink } from '#components/PlayerLink';
import { PlayerPickerModal } from '#components/PlayerPickerModal';
import { Divider } from '#components/Widget';
import { useModal } from '#providers/ModalProvider';
import { useSheets } from '#providers/SheetsProvider';
import { formatDate, formatDuration } from '#shared/timeUtils';
import style from './PlayerProfileModal.module.scss';

export interface PlayerProfileModalProps {
  name: string;
}

export const PlayerProfileModal: Component<PlayerProfileModalProps> = (
  props,
) => {
  const [, { open }] = useModal();
  const [, { latest }] = useSheets();

  const [selectedPlayerOverride, setSelectedPlayerOverride] = createSignal<
    string | undefined
  >(undefined);

  const [comparedPlayer, setComparedPlayer] = createSignal<string | undefined>(
    undefined,
  );

  const selectedPlayer = createMemo(
    () => selectedPlayerOverride() ?? props.name,
  );

  const playerStats = createMemo(() => latest().playerStats[selectedPlayer()]);

  const playerRatings = createMemo(() => ({
    elo: {
      player: latest().eloRatings.playerElos[selectedPlayer()],
      hybrid: latest().eloRatings.hybridElos[selectedPlayer()],
      teamIndividual: latest().eloRatings.teamIndividualElos[selectedPlayer()],
      team: latest().eloRatings.teamElos[selectedPlayer()],
    },
    glicko2: {
      player: latest().glicko2Ratings.playerGlicko2[selectedPlayer()],
      hybrid: latest().glicko2Ratings.hybridGlicko2[selectedPlayer()],
      teamIndividual:
        latest().glicko2Ratings.teamIndividualGlicko2[selectedPlayer()],
      team: latest().glicko2Ratings.teamGlicko2[selectedPlayer()],
    },
  }));

  const comparedPlayerStats = createMemo(() => {
    const player = comparedPlayer();
    if (!player) return undefined;
    return latest().playerStats[player];
  });

  const comparedPlayerRatings = createMemo(() => {
    const player = comparedPlayer();
    if (!player) return undefined;

    return {
      elo: {
        player: latest().eloRatings.playerElos[player],
        hybrid: latest().eloRatings.hybridElos[player],
        teamIndividual: latest().eloRatings.teamIndividualElos[player],
      },
      glicko2: {
        player: latest().glicko2Ratings.playerGlicko2[player],
        hybrid: latest().glicko2Ratings.hybridGlicko2[player],
        teamIndividual: latest().glicko2Ratings.teamIndividualGlicko2[player],
      },
    };
  });

  const handlePickerClose = (pickedPlayer?: unknown) => {
    if (pickedPlayer) {
      setComparedPlayer(pickedPlayer as string);
    }
  };

  const handleListClick = (ev: PointerEvent, player: string) => {
    ev.preventDefault();

    if (ev.shiftKey || ev.ctrlKey || ev.metaKey) {
      setComparedPlayer(player);
    } else {
      setSelectedPlayerOverride(player);
    }
  };

  const clearComparison = () => {
    setComparedPlayer(undefined);
  };

  const openPlayerPicker = () => {
    open({
      props: {
        component: PlayerPickerModal,
        disabledPlayers: [selectedPlayer()],
      },
      afterClose: handlePickerClose,
    });
  };

  return (
    <Modal
      class={style.modal}
      topLeftLabels="Player Profile"
      bottomRightLabels={[
        <Show when={comparedPlayer()}>
          <Button severity="secondary" onPointerUp={clearComparison}>
            Clear
          </Button>
        </Show>,
        <Button severity="secondary" onPointerUp={openPlayerPicker}>
          Compare
        </Button>,
      ]}
    >
      <div class={style.playerListContainer}>
        <For each={latest().generalStats.players}>
          {(player) => (
            <button
              type="button"
              onPointerUp={(ev) => handleListClick(ev, player)}
              classList={{
                [style.player]: true,
                [style.selected]: player === selectedPlayer(),
                [style.compared]: player === comparedPlayer(),
              }}
            >
              {player}
            </button>
          )}
        </For>
      </div>

      <Divider />

      <Show
        when={playerStats()}
        fallback={
          <div class={style.notFound}>
            Player "{selectedPlayer()}" not found.
          </div>
        }
      >
        <div class={style.container}>
          <span>Player{comparedPlayer() ? 's' : ''}:</span>
          <strong>
            {playerStats()?.name}

            <Show when={comparedPlayer()}>
              <span> vs </span>
              <strong>{comparedPlayer()}</strong>
            </Show>
          </strong>
        </div>

        <Divider class={style.divider} />

        <div class={style.container}>
          <span>Total Playtime:</span>
          <strong>
            <DeltaDisplay
              base={playerStats()?.playtime}
              compared={comparedPlayerStats()?.playtime}
              displayBase={true}
              displayCompared={true}
              formatter={(v) => formatDuration(v ?? 0)}
            />
          </strong>

          <span>Avg. Match Duration:</span>
          <strong>
            <DeltaDisplay
              base={playerStats()?.averageMatchDuration}
              compared={comparedPlayerStats()?.averageMatchDuration}
              displayBase={true}
              displayCompared={true}
              formatter={(v) => formatDuration(v ?? 0)}
            />
          </strong>
        </div>

        <Divider class={style.divider} />

        <div class={style.container}>
          <span>Total Matches:</span>
          <strong>
            <DeltaDisplay
              base={playerStats()?.matches}
              compared={comparedPlayerStats()?.matches}
              displayBase={true}
              displayCompared={true}
            />
          </strong>

          <span>Wins:</span>
          <strong>
            <DeltaDisplay
              base={playerStats()?.wins}
              compared={comparedPlayerStats()?.wins}
              displayBase={true}
              displayCompared={true}
            />
          </strong>

          <span>Losses:</span>
          <strong>
            <DeltaDisplay
              base={playerStats()?.losses}
              compared={comparedPlayerStats()?.losses}
              displayBase={true}
              displayCompared={true}
            />
          </strong>

          <span>Win Ratio:</span>
          <strong>
            <DeltaDisplay
              base={playerStats()?.winRatio}
              compared={comparedPlayerStats()?.winRatio}
              displayBase={true}
              displayCompared={true}
            />
          </strong>
        </div>

        <Divider class={style.divider} />

        <div class={style.container}>
          <span>Current Win Streak:</span>
          <strong>
            <DeltaDisplay
              base={playerStats()?.currentWinStreak}
              compared={comparedPlayerStats()?.currentWinStreak}
              displayBase={true}
              displayCompared={true}
            />
          </strong>

          <span>Current Loss Streak:</span>
          <strong>
            <DeltaDisplay
              base={playerStats()?.currentLossStreak}
              compared={comparedPlayerStats()?.currentLossStreak}
              displayBase={true}
              displayCompared={true}
            />
          </strong>

          <span>Longest Win Streak:</span>
          <strong>
            <DeltaDisplay
              base={playerStats()?.longestWinStreak}
              compared={comparedPlayerStats()?.longestWinStreak}
              displayBase={true}
              displayCompared={true}
            />
          </strong>

          <span>Longest Loss Streak:</span>
          <strong>
            <DeltaDisplay
              base={playerStats()?.longestLossStreak}
              compared={comparedPlayerStats()?.longestLossStreak}
              displayBase={true}
              displayCompared={true}
            />
          </strong>
        </div>

        <Divider class={style.divider} />

        <div class={style.container}>
          <span>Goals For:</span>
          <strong>
            <DeltaDisplay
              base={playerStats()?.goalsFor}
              compared={comparedPlayerStats()?.goalsFor}
              displayBase={true}
              displayCompared={true}
            />
          </strong>

          <span>Goals Against:</span>
          <strong>
            <DeltaDisplay
              base={playerStats()?.goalsAgainst}
              compared={comparedPlayerStats()?.goalsAgainst}
              displayBase={true}
              displayCompared={true}
            />
          </strong>

          <span>Goal Difference:</span>
          <strong>
            <DeltaDisplay
              base={playerStats()?.goalDifference}
              compared={comparedPlayerStats()?.goalDifference}
              displayBase={true}
              displayCompared={true}
            />
          </strong>

          <span>Goal Ratio:</span>
          <strong>
            <DeltaDisplay
              base={playerStats()?.goalRatio}
              compared={comparedPlayerStats()?.goalRatio}
              displayBase={true}
              displayCompared={true}
            />
          </strong>

          <span>Own Goals:</span>
          <strong>
            <DeltaDisplay
              base={playerStats()?.ownGoals}
              compared={comparedPlayerStats()?.ownGoals}
              displayBase={true}
              displayCompared={true}
            />
          </strong>
        </div>

        <Divider class={style.divider} />

        <div class={style.container}>
          <span>Last Match Date:</span>
          <strong>{formatDate(playerStats()?.lastMatchDate ?? null)}</strong>

          <span>Matches Today:</span>
          <strong>
            <DeltaDisplay
              base={playerStats()?.matchesInDay}
              compared={comparedPlayerStats()?.matchesInDay}
              displayBase={true}
              displayCompared={true}
            />
          </strong>

          <span>Most Matches In Day:</span>
          <strong>
            <DeltaDisplay
              base={playerStats()?.mostMatchesInDay}
              compared={comparedPlayerStats()?.mostMatchesInDay}
              displayBase={true}
              displayCompared={true}
            />
          </strong>

          <span>Matches In Season:</span>
          <strong>
            <DeltaDisplay
              base={playerStats()?.matchesInSeason}
              compared={comparedPlayerStats()?.matchesInSeason}
              displayBase={true}
              displayCompared={true}
            />
          </strong>

          <span>Most Matches In Season:</span>
          <strong>
            <DeltaDisplay
              base={playerStats()?.mostMatchesInSeason}
              compared={comparedPlayerStats()?.mostMatchesInSeason}
              displayBase={true}
              displayCompared={true}
            />
          </strong>
        </div>

        <Show
          when={playerRatings().elo.player || playerRatings().glicko2.player}
        >
          <Divider class={style.divider} />

          <div class={style.container}>
            <span>Individual Elo:</span>
            <strong>
              <DeltaDisplay
                base={playerRatings().elo.player?.rating}
                compared={comparedPlayerRatings()?.elo.player?.rating}
                displayBase={true}
                displayCompared={true}
              />
            </strong>

            <span>Hybrid Elo:</span>
            <strong>
              <DeltaDisplay
                base={playerRatings().elo.hybrid?.rating}
                compared={comparedPlayerRatings()?.elo.hybrid?.rating}
                displayBase={true}
                displayCompared={true}
              />
            </strong>

            <span>Team Indiv. Elo:</span>
            <strong>
              <DeltaDisplay
                base={playerRatings().elo.teamIndividual?.rating}
                compared={comparedPlayerRatings()?.elo.teamIndividual?.rating}
                displayBase={true}
                displayCompared={true}
              />
            </strong>
          </div>

          <Divider class={style.divider} />

          <div class={style.container}>
            <span>Individual Glicko2:</span>
            <strong>
              <DeltaDisplay
                base={playerRatings().glicko2.player?.rating}
                compared={comparedPlayerRatings()?.glicko2.player?.rating}
                displayBase={true}
                displayCompared={true}
              />
            </strong>

            <span>Hybrid Glicko2:</span>
            <strong>
              <DeltaDisplay
                base={playerRatings().glicko2.hybrid?.rating}
                compared={comparedPlayerRatings()?.glicko2.hybrid?.rating}
                displayBase={true}
                displayCompared={true}
              />
            </strong>

            <span>Team Indiv. Glicko2:</span>
            <strong>
              <DeltaDisplay
                base={playerRatings().glicko2.teamIndividual?.rating}
                compared={
                  comparedPlayerRatings()?.glicko2.teamIndividual?.rating
                }
                displayBase={true}
                displayCompared={true}
              />
            </strong>
          </div>
        </Show>

        <Show
          when={
            playerStats() &&
            Object.keys(playerStats()!.matchesWonAgainst).length > 0
          }
        >
          <Divider class={style.divider} />

          <strong class={style.sectionLabel}>Head-to-Head</strong>

          <table class={style.hthTable}>
            <thead>
              <tr>
                <td>Opponent</td>
                <td
                  classList={{
                    [style.minWidth]: true,
                    [style.alignRight]: true,
                  }}
                >
                  Won
                </td>
                <td
                  classList={{
                    [style.minWidth]: true,
                    [style.alignRight]: true,
                  }}
                >
                  Lost
                </td>
                <td
                  classList={{
                    [style.minWidth]: true,
                    [style.alignRight]: true,
                  }}
                >
                  Win%
                </td>
                <td
                  classList={{
                    [style.minWidth]: true,
                    [style.alignCenter]: true,
                  }}
                >
                  1v1
                </td>
                <td
                  classList={{
                    [style.minWidth]: true,
                    [style.alignCenter]: true,
                  }}
                >
                  2v2
                </td>
              </tr>
            </thead>
            <tbody>
              <For
                each={Object.keys({
                  ...playerStats()?.matchesWonAgainst,
                  ...playerStats()?.matchesLostAgainst,
                }).sort()}
              >
                {(opponent) => {
                  const wins = () =>
                    playerStats()?.matchesWonAgainst[opponent] ?? 0;
                  const losses = () =>
                    playerStats()?.matchesLostAgainst[opponent] ?? 0;
                  const total = () => wins() + losses();
                  const winPct = () =>
                    total() > 0 ? (wins() / total()) * 100 : 0;

                  const winsS = () =>
                    playerStats()?.matchesWonAgainstSingles[opponent] ?? 0;
                  const lossesS = () =>
                    playerStats()?.matchesLostAgainstSingles[opponent] ?? 0;
                  const winsD = () =>
                    playerStats()?.matchesWonAgainstDoubles[opponent] ?? 0;
                  const lossesD = () =>
                    playerStats()?.matchesLostAgainstDoubles[opponent] ?? 0;

                  return (
                    <tr>
                      <td>
                        <PlayerLink name={opponent} />
                      </td>
                      <td
                        classList={{
                          [style.minWidth]: true,
                          [style.alignRight]: true,
                          [style.positive]: true,
                        }}
                      >
                        {wins()}
                      </td>
                      <td
                        classList={{
                          [style.minWidth]: true,
                          [style.alignRight]: true,
                          [style.negative]: true,
                        }}
                      >
                        {losses()}
                      </td>
                      <td
                        classList={{
                          [style.minWidth]: true,
                          [style.alignRight]: true,
                        }}
                      >
                        {winPct().toFixed(0)}%
                      </td>
                      <td class={style.minWidth}>
                        <Show when={winsS() + lossesS() > 0}>
                          <div class={style.comparison}>
                            <span class={style.positive}>{winsS()}</span>
                            <span>:</span>
                            <span class={style.negative}>{lossesS()}</span>
                          </div>
                        </Show>
                      </td>
                      <td class={style.minWidth}>
                        <Show when={winsD() + lossesD() > 0}>
                          <div class={style.comparison}>
                            <span class={style.positive}>{winsD()}</span>
                            <span>:</span>
                            <span class={style.negative}>{lossesD()}</span>
                          </div>
                        </Show>
                      </td>
                    </tr>
                  );
                }}
              </For>
            </tbody>
          </table>
        </Show>
      </Show>
    </Modal>
  );
};
