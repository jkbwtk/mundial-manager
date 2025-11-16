import { quickSwitch } from '#shared/utils';
import style from '#styles/TeamColors.module.scss';

export function getTeamColorClass(teamColor: string): string {
  return quickSwitch(teamColor.toLowerCase(), {
    czerwony2: style.teamColorRed2,
    czerwony3: style.teamColorRed3,
    zielony: style.teamColorGreen,
    niebieski: style.teamColorBlue,
    default: '',
  });
}
