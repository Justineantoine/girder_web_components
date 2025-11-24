import { reactive } from 'vue';

export class DebounceCounter {
  constructor(delay = 200) {
    this.state = reactive({
      flag: false,
      count: 0,
    });
    this.delay = delay;
    this.timeout = null;
  }

  inc() {
    this.state.count += 1;
    if (this.state.count > 0) {
      this._toggleFlag(true);
    }
  }

  dec() {
    this.state.count = Math.max(0, this.state.count - 1);
    if (this.state.count === 0) {
      this._toggleFlag(false);
    }
  }

  _toggleFlag(val) {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(() => {
      this.state.flag = val;
    }, this.delay);
  }

  get count() {
    return this.state.count;
  }

  get flag() {
    return this.state.flag;
  }
}