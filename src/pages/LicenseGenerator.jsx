/* eslint-disable no-unused-vars */
import { useState, useMemo } from "react";
import "./LicenseGenerator.css";
import { Helmet } from "react-helmet";

/* ── Icons ── */
const IconLicense = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);
const IconCopy = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconDownload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

/* ══════════════════════════════════════
   License data
   ══════════════════════════════════════ */
const LICENSES = [
  {
    id: "mit",
    name: "MIT License",
    spdx: "MIT",
    desc: "Short, permissive. Allows almost anything with attribution. Most popular open-source license.",
    fields: ["year", "author"],
    permissions: [
      { type: "allow",   text: "Commercial use" },
      { type: "allow",   text: "Modification" },
      { type: "allow",   text: "Distribution" },
      { type: "allow",   text: "Private use" },
      { type: "require", text: "License & copyright notice" },
    ],
    text: (f) => `MIT License

Copyright (c) ${f.year} ${f.author}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`,
  },
  {
    id: "apache2",
    name: "Apache License 2.0",
    spdx: "Apache-2.0",
    desc: "Permissive with patent protection. Good for enterprise projects. Requires change notices.",
    fields: ["year", "author"],
    permissions: [
      { type: "allow",   text: "Commercial use" },
      { type: "allow",   text: "Modification" },
      { type: "allow",   text: "Distribution" },
      { type: "allow",   text: "Patent use" },
      { type: "allow",   text: "Private use" },
      { type: "require", text: "License & copyright notice" },
      { type: "require", text: "State changes" },
    ],
    text: (f) => `Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/

Copyright ${f.year} ${f.author}

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.`,
  },
  {
    id: "gpl3",
    name: "GNU GPL v3.0",
    spdx: "GPL-3.0",
    desc: "Strong copyleft. Derivatives must also be GPL. Protects user freedoms. Used by Linux.",
    fields: ["year", "author", "project"],
    permissions: [
      { type: "allow",   text: "Commercial use" },
      { type: "allow",   text: "Modification" },
      { type: "allow",   text: "Distribution" },
      { type: "allow",   text: "Patent use" },
      { type: "allow",   text: "Private use" },
      { type: "require", text: "Disclose source" },
      { type: "require", text: "License & copyright notice" },
      { type: "require", text: "Same license on derivatives" },
      { type: "require", text: "State changes" },
    ],
    text: (f) => `${f.project}
Copyright (C) ${f.year} ${f.author}

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.`,
  },
  {
    id: "lgpl3",
    name: "GNU LGPL v3.0",
    spdx: "LGPL-3.0",
    desc: "Weaker copyleft. Allows linking from proprietary software. Common for libraries.",
    fields: ["year", "author", "project"],
    permissions: [
      { type: "allow",   text: "Commercial use" },
      { type: "allow",   text: "Modification" },
      { type: "allow",   text: "Distribution" },
      { type: "allow",   text: "Private use" },
      { type: "allow",   text: "Patent use" },
      { type: "require", text: "Disclose source" },
      { type: "require", text: "License & copyright notice" },
      { type: "require", text: "Same license on derivatives" },
    ],
    text: (f) => `${f.project}
Copyright (C) ${f.year} ${f.author}

This library is free software; you can redistribute it and/or
modify it under the terms of the GNU Lesser General Public
License as published by the Free Software Foundation; either
version 3 of the License, or (at your option) any later version.

This library is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with this library. If not, see <https://www.gnu.org/licenses/>.`,
  },
  {
    id: "agpl3",
    name: "GNU AGPL v3.0",
    spdx: "AGPL-3.0",
    desc: "Like GPL but covers network use. SaaS using this code must also open-source it.",
    fields: ["year", "author", "project"],
    permissions: [
      { type: "allow",   text: "Commercial use" },
      { type: "allow",   text: "Modification" },
      { type: "allow",   text: "Distribution" },
      { type: "allow",   text: "Patent use" },
      { type: "allow",   text: "Private use" },
      { type: "require", text: "Disclose source" },
      { type: "require", text: "Network use = distribution" },
      { type: "require", text: "License & copyright notice" },
      { type: "require", text: "Same license on derivatives" },
    ],
    text: (f) => `${f.project}
Copyright (C) ${f.year} ${f.author}

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.`,
  },
  {
    id: "mpl2",
    name: "Mozilla Public License 2.0",
    spdx: "MPL-2.0",
    desc: "File-level copyleft. Modified files must stay MPL, but can be combined with proprietary code.",
    fields: ["year", "author"],
    permissions: [
      { type: "allow",   text: "Commercial use" },
      { type: "allow",   text: "Modification" },
      { type: "allow",   text: "Distribution" },
      { type: "allow",   text: "Patent use" },
      { type: "allow",   text: "Private use" },
      { type: "require", text: "Disclose source (modified files)" },
      { type: "require", text: "License & copyright notice" },
      { type: "require", text: "Same license on modified files" },
    ],
    text: (f) => `Mozilla Public License Version 2.0

Copyright (c) ${f.year} ${f.author}

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.`,
  },
  {
    id: "bsd2",
    name: 'BSD 2-Clause "Simplified"',
    spdx: "BSD-2-Clause",
    desc: "Like MIT but slightly different wording. Permissive with minimal requirements.",
    fields: ["year", "author"],
    permissions: [
      { type: "allow",   text: "Commercial use" },
      { type: "allow",   text: "Modification" },
      { type: "allow",   text: "Distribution" },
      { type: "allow",   text: "Private use" },
      { type: "require", text: "License & copyright notice" },
    ],
    text: (f) => `BSD 2-Clause License

Copyright (c) ${f.year}, ${f.author}
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`,
  },
  {
    id: "bsd3",
    name: 'BSD 3-Clause "New"',
    spdx: "BSD-3-Clause",
    desc: "Like BSD 2-Clause but adds a non-endorsement clause. Used by many BSD projects.",
    fields: ["year", "author"],
    permissions: [
      { type: "allow",   text: "Commercial use" },
      { type: "allow",   text: "Modification" },
      { type: "allow",   text: "Distribution" },
      { type: "allow",   text: "Private use" },
      { type: "require", text: "License & copyright notice" },
      { type: "forbid",  text: "Use of contributor names" },
    ],
    text: (f) => `BSD 3-Clause License

Copyright (c) ${f.year}, ${f.author}
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors
   may be used to endorse or promote products derived from this software
   without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`,
  },
  {
    id: "isc",
    name: "ISC License",
    spdx: "ISC",
    desc: "Functionally identical to MIT but even shorter. Used by OpenBSD and many npm packages.",
    fields: ["year", "author"],
    permissions: [
      { type: "allow",   text: "Commercial use" },
      { type: "allow",   text: "Modification" },
      { type: "allow",   text: "Distribution" },
      { type: "allow",   text: "Private use" },
      { type: "require", text: "License & copyright notice" },
    ],
    text: (f) => `ISC License

Copyright (c) ${f.year}, ${f.author}

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.`,
  },
  {
    id: "cc0",
    name: "Creative Commons Zero v1.0",
    spdx: "CC0-1.0",
    desc: "Public domain dedication. No rights reserved. Anyone can use it for any purpose.",
    fields: ["year", "author"],
    permissions: [
      { type: "allow",   text: "Commercial use" },
      { type: "allow",   text: "Modification" },
      { type: "allow",   text: "Distribution" },
      { type: "allow",   text: "Private use" },
    ],
    text: (f) => `CC0 1.0 Universal

Copyright (c) ${f.year} ${f.author}

The person who associated a work with this deed has dedicated the work to the
public domain by waiving all of his or her rights to the work worldwide under
copyright law, including all related and neighboring rights, to the extent
allowed by law.

You can copy, modify, distribute and perform the work, even for commercial
purposes, all without asking permission. See the Creative Commons CC0 Public
Domain Dedication for more information:
https://creativecommons.org/publicdomain/zero/1.0/`,
  },
  {
    id: "unlicense",
    name: "The Unlicense",
    spdx: "Unlicense",
    desc: "Public domain equivalent. Explicitly releases all rights. Simplest way to go public domain.",
    fields: [],
    permissions: [
      { type: "allow",   text: "Commercial use" },
      { type: "allow",   text: "Modification" },
      { type: "allow",   text: "Distribution" },
      { type: "allow",   text: "Private use" },
    ],
    text: () => `This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <https://unlicense.org>`,
  },
  {
    id: "boost",
    name: "Boost Software License 1.0",
    spdx: "BSL-1.0",
    desc: "Simple permissive license. No attribution needed in binaries. Popular in C++ libraries.",
    fields: ["year", "author"],
    permissions: [
      { type: "allow",   text: "Commercial use" },
      { type: "allow",   text: "Modification" },
      { type: "allow",   text: "Distribution" },
      { type: "allow",   text: "Private use" },
      { type: "require", text: "License & copyright notice (source only)" },
    ],
    text: (f) => `Boost Software License - Version 1.0 - August 17th, 2003

Copyright (c) ${f.year} ${f.author}

Permission is hereby granted, free of charge, to any person or organization
obtaining a copy of the software and accompanying documentation covered by
this license (the "Software") to use, reproduce, display, distribute,
execute, and transmit the Software, and to prepare derivative works of the
Software, and to permit third-parties to whom the Software is furnished to
do so, all subject to the following:

The copyright notices in the Software and this entire statement, including
the above license grant, this restriction and the following disclaimer,
must be included in all copies of the Software, in whole or in part, and
all derivative works of the Software, unless such copies or derivative
works are solely in the form of machine-executable object code generated by
a source language processor.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE, TITLE AND NON-INFRINGEMENT. IN NO EVENT
SHALL THE COPYRIGHT HOLDERS OR ANYONE DISTRIBUTING THE SOFTWARE BE LIABLE
FOR ANY DAMAGES OR OTHER LIABILITY, WHETHER IN CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.`,
  },
];

const PERM_LABEL = {
  allow:   "✓",
  forbid:  "✗",
  require: "!",
};

/* ══════════════════
   Main Component
   ══════════════════ */
export default function LicenseGenerator() {
  const currentYear = new Date().getFullYear().toString();

  const [selectedId, setSelectedId] = useState("mit");
  const [fields, setFields] = useState({
    year: currentYear,
    author: "",
    project: "",
  });
  const [copied, setCopied] = useState(false);

  const license = LICENSES.find(l => l.id === selectedId);

  /* ── Fill fields ── */
  const setField = (key, val) => setFields(prev => ({ ...prev, [key]: val }));

  /* ── Build output ── */
  const output = useMemo(() => {
    if (!license) return "";
    const f = {
      year:    fields.year    || currentYear,
      author:  fields.author  || "[Your Name]",
      project: fields.project || "[Project Name]",
    };
    return license.text(f);
  }, [license, fields, currentYear]);

  /* ── Copy ── */
  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── Download ── */
  const handleDownload = () => {
    const blob = new Blob([output], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "LICENSE"; a.click();
    URL.revokeObjectURL(url);
  };

  const lineCount = output.split("\n").length;

  return (
    <>
    <Helmet>
      <title>Free Open Source License Generator – MIT, GPL, Apache & More</title>
      <meta name="description" content="Generate a LICENSE file for your project in seconds. Choose from MIT, Apache 2.0, GPL, BSD, ISC, CC0 and more. Download ready-to-use files instantly." />
      <meta name="keywords" content="license generator, open source license, mit license generator, gpl license, apache license, free license tool, github license" />
      <link rel="canonical" href="https://shauryatools.vercel.app/license-generator" />
    </Helmet>
    <div className="lg-page">
      <div className="lg-inner">

        {/* ── Header ── */}
        <div className="lg-header">
          <div className="lg-icon"><IconLicense /></div>
          <div>
            <span className="lg-cat">Dev Tools</span>
            <h1>License Generator</h1>
            <p>Choose an open-source license, fill in your details, and download a ready-to-use LICENSE file.</p>
          </div>
        </div>

        {/* ── Main Grid ── */}
        <div className="lg-grid">

          {/* ── Left: picker + fields ── */}
          <div className="lg-col-left">

            {/* License list */}
            <div className="lg-card">
              <div className="lg-card-head">
                <span className="lg-card-title">Choose a License</span>
                <span className="lg-count-badge">{LICENSES.length} licenses</span>
              </div>
              <div className="lg-license-list">
                {LICENSES.map(l => (
                  <div
                    key={l.id}
                    className={`lg-license-item ${selectedId === l.id ? "lg-active" : ""}`}
                    onClick={() => setSelectedId(l.id)}
                  >
                    <span className="lg-license-radio">
                      {selectedId === l.id && <span className="lg-license-radio-dot" />}
                    </span>
                    <span className="lg-license-info">
                      <span className="lg-license-name">{l.name}</span>
                      <span className="lg-license-desc">{l.desc}</span>
                    </span>
                    <span className="lg-license-spdx">{l.spdx}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ── Right: fields + output ── */}
          <div className="lg-col-right">

            {/* Fields */}
            {license && license.fields.length > 0 && (
              <div className="lg-card">
                <div className="lg-card-head">
                  <span className="lg-card-title">Your Details</span>
                </div>
                <div className="lg-fields-body">
                  {license.fields.includes("year") && (
                    <div className="lg-field-group">
                      <label className="lg-field-label">Year</label>
                      <input
                        className="lg-field-input"
                        value={fields.year}
                        onChange={e => setField("year", e.target.value)}
                        placeholder={currentYear}
                        maxLength={4}
                      />
                    </div>
                  )}
                  {license.fields.includes("author") && (
                    <div className="lg-field-group">
                      <label className="lg-field-label">Full Name / Organization</label>
                      <input
                        className="lg-field-input"
                        value={fields.author}
                        onChange={e => setField("author", e.target.value)}
                        placeholder="Jane Doe"
                      />
                    </div>
                  )}
                  {license.fields.includes("project") && (
                    <div className="lg-field-group">
                      <label className="lg-field-label">Project Name</label>
                      <input
                        className="lg-field-input"
                        value={fields.project}
                        onChange={e => setField("project", e.target.value)}
                        placeholder="My Awesome Project"
                      />
                    </div>
                  )}
                </div>

                {/* Permission summary */}
                <div className="lg-tags">
                  {license.permissions.map((p, i) => (
                    <span key={i} className={`lg-pill ${p.type}`}>
                      {PERM_LABEL[p.type]} {p.text}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* If no fields (e.g. Unlicense), still show permissions */}
            {license && license.fields.length === 0 && (
              <div className="lg-card">
                <div className="lg-card-head">
                  <span className="lg-card-title">Permissions</span>
                </div>
                <div className="lg-tags">
                  {license.permissions.map((p, i) => (
                    <span key={i} className={`lg-pill ${p.type}`}>
                      {PERM_LABEL[p.type]} {p.text}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Output */}
            <div className="lg-card">
              <div className="lg-card-head">
                <span className="lg-card-title">Output — LICENSE</span>
                <div className="lg-card-actions">
                  <span className="lg-count-badge">{lineCount} lines</span>
                  <button className="lg-sm-btn" onClick={handleCopy}>
                    {copied ? <IconCheck /> : <IconCopy />}
                    {copied ? " Copied!" : " Copy"}
                  </button>
                  <button className="lg-sm-btn" onClick={handleDownload}>
                    <IconDownload /> Download
                  </button>
                </div>
              </div>
              <div className="lg-output-wrap">
                <textarea
                  className="lg-output"
                  value={output}
                  onChange={() => {}}
                  spellCheck={false}
                  readOnly
                />
                <span className="lg-line-count">{lineCount} lines</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
    </>
  );
}