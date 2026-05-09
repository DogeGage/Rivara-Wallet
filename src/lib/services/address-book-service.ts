/*
 * Rivara Wallet
 * Copyright (c) 2024-2026 DogeGage
 * Licensed under DogeGage Source Available License
 */
/**
 * Address Book Service
 * Stores named contacts per chain in localStorage
 */

export interface Contact {
  id: string;
  name: string;
  address: string;
  chain: string;
}

class AddressBookService {
  private readonly KEY = "addressBook";

  getAll(): Contact[] {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  getByChain(chain: string): Contact[] {
    return this.getAll().filter((c) => c.chain === chain);
  }

  add(name: string, address: string, chain: string): Contact {
    const contacts = this.getAll();
    const contact: Contact = {
      id: crypto.randomUUID(),
      name: name.trim(),
      address: address.trim(),
      chain,
    };
    contacts.push(contact);
    this.save(contacts);
    return contact;
  }

  update(id: string, name: string, address: string, chain: string): void {
    const contacts = this.getAll().map((c) =>
      c.id === id
        ? { ...c, name: name.trim(), address: address.trim(), chain }
        : c,
    );
    this.save(contacts);
  }

  remove(id: string): void {
    this.save(this.getAll().filter((c) => c.id !== id));
  }

  private save(contacts: Contact[]): void {
    localStorage.setItem(this.KEY, JSON.stringify(contacts));
  }
}

export const addressBookService = new AddressBookService();
