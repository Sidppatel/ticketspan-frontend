export const FLAGS = {
  get newEventPage(): boolean {
    const local = localStorage.getItem('svyne_flag_new_event_page');
    if (local !== null) return local === 'true';
    return true;
  },

  get checkoutDrawer(): boolean {
    const local = localStorage.getItem('svyne_flag_checkout_drawer');
    if (local !== null) return local === 'true';
    return true;
  },

  get newSeatingMap(): boolean {
    const local = localStorage.getItem('svyne_flag_new_seating_map');
    if (local !== null) return local === 'true';
    return true;
  },

  get newMotion(): boolean {
    const local = localStorage.getItem('svyne_flag_new_motion');
    if (local !== null) return local === 'true';
    return true;
  },

  get newHero(): boolean {
    const local = localStorage.getItem('svyne_flag_new_hero');
    if (local !== null) return local === 'true';
    return true;
  },
};

export function setFlag(name: keyof typeof FLAGS, value: boolean): void {
  localStorage.setItem(`svyne_flag_${name.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)}`, String(value));
}

export function resetFlags(): void {
  localStorage.removeItem('svyne_flag_new_event_page');
  localStorage.removeItem('svyne_flag_checkout_drawer');
  localStorage.removeItem('svyne_flag_new_seating_map');
  localStorage.removeItem('svyne_flag_new_motion');
  localStorage.removeItem('svyne_flag_new_hero');
}
