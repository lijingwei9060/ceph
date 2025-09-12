// -*- mode:C++; tab-width:8; c-basic-offset:2; indent-tabs-mode:t -*- // vim: ts=8 sw=2 smarttab ft=cpp 

/*
 * Ceph - scalable distributed file system
 *
 * Copyright (C) 2025-2026 International Business Machines Corp. (IBM)
 *      
 * This is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License version 2.1, as published by the Free Software
 * Foundation.  See file COPYING.
 *
*/

#include <catch2/catch_config.hpp>

#include <catch2/catch_test_macros.hpp>
#include <catch2/catch_template_test_macros.hpp>

#include <catch2/generators/catch_generators.hpp>
#include <catch2/generators/catch_generators_adapters.hpp>

#include <catch2/matchers/catch_matchers_all.hpp>

#define CATCH_CONFIG_MAIN

#include "rgw/ceph_fdb.h"

#include <fmt/format.h>
#include <fmt/chrono.h>
#include <fmt/ranges.h>

#include "include/random.h"

#include <chrono>
#include <vector>
#include <ranges>
#include <algorithm>

using Catch::Matchers::AllMatch;

using fmt::format;
using fmt::println;

using std::end;
using std::begin;

using std::string;
using std::string_view;

using std::to_string;

using std::vector;

using namespace std::literals::string_literals;

namespace lfdb = ceph::libfdb;

// Be nice to Catch2's template-test macros:
using string_pair = std::pair<std::string, std::string>;

std::string make_key(const int n, std::string_view prefix = "key") {
return fmt::format("{}_{:10d}", prefix, n);
}

std::string make_value(const int n) {
 return fmt::format("value_{:10d}", n);
}

// Clean up test keys when we leave scope:
struct janitor final
{
 ceph::libfdb::database_handle dbh_;

 // flip this off if you need artifacts after debugging:
 bool drop_after_scope = true;

 janitor(ceph::libfdb::database_handle dbh_)
  : dbh_(dbh_)
 {
  REQUIRE(nullptr != dbh_);
 }

 janitor()
  : janitor(ceph::libfdb::create_database())
 {}

 ~janitor()
 {
  if(drop_after_scope)
   drop_all(dbh_);
 }

 ceph::libfdb::database_handle dbh() { return dbh_; }

 static void drop_all(ceph::libfdb::database_handle dbh_) {
   lfdb::erase(ceph::libfdb::make_transaction(dbh_),
               lfdb::select { "", "\xFF" });
 }

 void drop_all() { 
  return drop_all(dbh()); 
 }

 static void drop_all_keys(ceph::libfdb::database_handle dbh_) {

   // Note: technically, [0x00, 0xFF) is needed to include the system keys (if the transaction's allowed to
   // access these). However, special permissions are needed to access these magical "system keys" and we
   // probably don't actually want to delete them erroneously. So, we stick with our key range...
   // ("500,000,000 records aught to be enough for anybody.") 
   lfdb::erase(ceph::libfdb::make_transaction(dbh_),
               lfdb::select { make_key(0), make_key(500'000'000) });
   }

  void drop_all_keys() {
    return drop_all_keys(dbh());
  }

/* This is tempting, but I think it might also *hide* bugs at times. Thoughts?
  operator ceph::libfdb::database_handle() { ... }
*/
};

inline std::map<std::string, std::string> make_monotonic_kvs(const unsigned N)
{
 std::map<std::string, std::string> kvs;

 for(const auto i : std::ranges::iota_view(0u, N)) {
  kvs.insert({ make_key(i), make_value(i) });
 }

 return kvs;
}

inline void populate_monotonic(lfdb::database_handle dbh, const int N, std::string_view prefix = "key")
{
 using namespace std::ranges;

 using std::ranges::for_each;

 unsigned stride = 1'000;

 auto txn = lfdb::make_transaction(dbh);

 for(auto block : views::iota(0, N) | views::chunk(stride)) {
  for_each(block, [&txn, i = 0](const auto& n) mutable {
    lfdb::set(txn, make_key(n), make_value(n));
    i++;
  });
 }
}

constexpr const char * const msg = "Hello, World!"; 
constexpr const char msg_with_null[] = { '\0', 'H', 'i', '\0', ' ', 't', 'h', 'e', 'r', 'e', '!', '\0'};

TEST_CASE("fdb conversions (ceph)", "[fdb][rgw]") {

 const char *msg = "Hello, World!";

 // ceph::buffer::list -> span<uint8_t> -> std::string
 {
  ceph::buffer::list n;
  n.append(msg);

  std::vector<std::uint8_t> x;
  x = ceph::libfdb::to::convert(n);

  std::string o;
  ceph::libfdb::from::convert(x, o); 

  REQUIRE_THAT(n, Catch::Matchers::RangeEquals(o));
 }

 // buffer::list -> span<uint8_t> -> buffer::list 
 {
 ceph::buffer::list n;
 n.append(msg);

 std::vector<std::uint8_t> x;
 x = ceph::libfdb::to::convert(n);

 ceph::buffer::list o;
 ceph::libfdb::from::convert(x, o);

 REQUIRE_THAT(n, Catch::Matchers::RangeEquals(o));
 }
}

TEST_CASE("non-owning conversions are bad") {

// It's possible to write an innocent-looking but actually
// bad conversion (we may be able to fix this through some
// resdesign, but it's how it is for now, and not user-facing). Anyway
// DON'T DO THIS! :-)
// ...since it won't throw consistently, I'll leave it as a cautionary
// tale:
/*
 const char *msg = "Greetings!";

 ceph::buffer::list n;
 n.append(msg);

 // This looks innocuous... however...
 std::span<const std::uint8_t> x;

 // BAD: span<> is non-owning!
 x = ceph::libfdb::to::convert(n);

 ceph::buffer::list o;

 // Unfortunately, this won't /always/ throw... but, don't do it! :-)
 CHECK_THROWS(ceph::libfdb::from::convert(x, o));
*/
 SUCCEED();
}

TEST_CASE("fdb conversions (round-trip, ceph)", "[fdb][rgw]") {

  auto dbh = lfdb::create_database();

  SECTION("string_view -> buffer::list")
  {
    const std::string_view n = "Hello, World!";
    ceph::buffer::list o;
  
    lfdb::set(lfdb::make_transaction(dbh), "key", n, lfdb::commit_after_op::commit);
    lfdb::get(lfdb::make_transaction(dbh), "key", o);
  
    REQUIRE_THAT(n, Catch::Matchers::RangeEquals(o));
  }

  SECTION("buffer::list (and buffer::list key) -> buffer::list")
  {
    const std::string_view n { "Hello, World!" };
  
    ceph::buffer::list o;

    // Why the pointless append? Well, to make sure that we aren't double-appending!
    o.append(n);
  

    lfdb::set(lfdb::make_transaction(dbh), "key", n, lfdb::commit_after_op::commit);
    lfdb::get(lfdb::make_transaction(dbh), "key", o);
 
    REQUIRE_THAT(n, Catch::Matchers::RangeEquals(o));
  }

  SECTION("buffer::list (and buffer::list key) -> buffer::list")
  {
    ceph::buffer::list n;
    n.append("Hello, World!");
  
    ceph::buffer::list o;
    o.append(n);
  
    lfdb::set(lfdb::make_transaction(dbh), "key", n, lfdb::commit_after_op::commit);
    lfdb::get(lfdb::make_transaction(dbh), "key", o);
  
    REQUIRE_THAT(n, Catch::Matchers::RangeEquals(o));
  }

  SECTION("buffer::list (and buffer::list key) -> buffer::list")
  {
    ceph::buffer::list n;
    n.append("Hello, World!");
  
    ceph::buffer::list o;
    o.append(n);
  
    lfdb::set(lfdb::make_transaction(dbh), "key", n, lfdb::commit_after_op::commit);
    lfdb::get(lfdb::make_transaction(dbh), "key", o);
  
    REQUIRE_THAT(n, Catch::Matchers::RangeEquals(o));
  }
}

#include <catch2/catch_session.hpp>

int main(int argc, char **argv) 
{
  int result = Catch::Session().run(argc, argv);

  // Make sure that FoundationDB is shut down once and only once:
  ceph::libfdb::shutdown_libfdb(); 

  return result;
}

