import { Util } from "@/plugin";
const { deepClone } = Util;

import stateTemplate from "@/store/stateTemplate";

const state = deepClone(stateTemplate("groupState"));

export default state;
