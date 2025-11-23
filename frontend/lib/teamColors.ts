import { quickSwitch } from '#shared/utils';
import style from '#styles/TeamColors.module.scss';
import variables from '#styles/variables.module.scss';

export function getTeamColorClass(teamColor: string): string {
  return quickSwitch(teamColor.toLowerCase(), {
    czerwony2: style.teamColorRed2,
    czerwony3: style.teamColorRed3,
    zielony: style.teamColorGreen,
    niebieski: style.teamColorBlue,
    default: '',
  });
}

export function getTeamColor(teamColor: string): string {
  return quickSwitch(teamColor.toLowerCase(), {
    czerwony2: variables.red,
    czerwony3: variables.redBright,
    zielony: variables.green,
    niebieski: variables.blue,
    default: variables.gray,
  });
}
